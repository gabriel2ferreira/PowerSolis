import { useMemo } from 'react';
import { 
  calculateIEEEEquivalentAgingFactor, 
  calculateIEEELossOfLife, 
  calculateIEEEHealthPercentage 
} from '@/utils/lifeExpectancyCalculations';
import { 
  calculateIECLossOfLife, 
  calculateIECHealthPercentage 
} from '@/utils/iecCalculations';

export const useDegradationCurveData = (equipment, thermalData, standard = 'IEEE') => {
  return useMemo(() => {
    console.log("[useDegradationCurveData] Generating curve for standard:", standard);
    
    if (!equipment) return [];

    const now = new Date();
    const installDate = equipment.installation_date ? new Date(equipment.installation_date) : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // default 1 year ago
    const lifespanYears = equipment.lifespan_years || 20;
    const endOfLifeDate = new Date(installDate.getTime() + lifespanYears * 365.25 * 24 * 60 * 60 * 1000);
    
    // Sort thermal data
    const sortedData = [...(thermalData || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const curvePoints = [];
    let currentHealth = 100;
    let currentLOL = 0;
    
    // Base simulation if no actual data is available
    if (sortedData.length === 0) {
      console.log("[useDegradationCurveData] No thermal data, simulating standard curve");
      const totalDays = (endOfLifeDate - installDate) / (1000 * 60 * 60 * 24);
      for (let i = 0; i <= totalDays; i += 30) {
        const d = new Date(installDate.getTime() + i * 24 * 60 * 60 * 1000);
        const health = Math.max(0, 100 - (i / totalDays) * 100);
        curvePoints.push({
          date: d.toISOString(),
          health: health,
          lol: 100 - health,
          temperature: 70 + Math.random() * 10 // Simulated temp
        });
      }
    } else {
      console.log("[useDegradationCurveData] Generating curve from thermal data points:", sortedData.length);
      const totalLifeHours = lifespanYears * 365.25 * 24;
      const totalLifeDays = lifespanYears * 365.25;
      
      let cumulativeHours = 0;
      let cumulativeIECDaysLOL = 0;

      sortedData.forEach((reading, index) => {
        const temp = parseFloat(reading.hot_spot_temperature) || 70;
        const time = new Date(reading.timestamp);
        
        let dtHours = 1;
        if (index > 0) {
          const prevTime = new Date(sortedData[index - 1].timestamp);
          dtHours = (time - prevTime) / (1000 * 60 * 60);
          if (dtHours > 24) dtHours = 24; // Cap max interval gap to 24h for smooth LOL
        }
        
        if (standard === 'IEEE') {
          const feqa = calculateIEEEEquivalentAgingFactor([{ temperature: temp, timeStep: dtHours }]);
          const lolIncr = calculateIEEELossOfLife(feqa, 1.0, totalLifeHours);
          currentLOL += lolIncr * dtHours; 
          currentHealth = calculateIEEEHealthPercentage(currentLOL);
        } else {
          cumulativeIECDaysLOL = calculateIECLossOfLife([{ temperature: temp, timeInterval: dtHours / 24 }], cumulativeIECDaysLOL);
          currentHealth = calculateIECHealthPercentage(cumulativeIECDaysLOL, totalLifeDays);
          currentLOL = 100 - currentHealth;
        }

        // Subsample points to avoid massive arrays (take 1 per day approx)
        if (index % 24 === 0 || index === sortedData.length - 1) {
          curvePoints.push({
            date: time.toISOString(),
            health: currentHealth,
            lol: currentLOL,
            temperature: temp
          });
        }
      });

      // Projection to end of life
      if (currentHealth > 0) {
        let lastDate = curvePoints[curvePoints.length - 1].date;
        let projDate = new Date(lastDate);
        let projHealth = currentHealth;
        let projLOL = currentLOL;
        
        const avgTemp = sortedData.reduce((acc, val) => acc + parseFloat(val.hot_spot_temperature), 0) / sortedData.length;
        const feqaProj = calculateIEEEEquivalentAgingFactor([{ temperature: avgTemp, timeStep: 24 }]);
        const dailyDegradation = standard === 'IEEE' 
          ? calculateIEEELossOfLife(feqaProj, 1.0, totalLifeHours) * 24 
          : (calculateIECLossOfLife([{ temperature: avgTemp, timeInterval: 1 }], 0) / totalLifeDays) * 100;
        
        while (projHealth > 0 && projDate < endOfLifeDate) {
          projDate = new Date(projDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
          projLOL += dailyDegradation * 30;
          projHealth = Math.max(0, 100 - projLOL);
          
          curvePoints.push({
            date: projDate.toISOString(),
            health: projHealth,
            lol: projLOL,
            temperature: null, // No exact temperature projection
            isProjected: true
          });
        }
      }
    }
    
    // Ensure chronological order
    curvePoints.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Ensure at least 2 points
    if (curvePoints.length < 2) {
      curvePoints.push({ date: new Date().toISOString(), health: 100, lol: 0, temperature: 70 });
      curvePoints.push({ date: new Date(Date.now() + 86400000).toISOString(), health: 99, lol: 1, temperature: 70 });
    }

    console.log(`[useDegradationCurveData] Generated ${curvePoints.length} points.`);
    return curvePoints;

  }, [equipment, thermalData, standard]);
};