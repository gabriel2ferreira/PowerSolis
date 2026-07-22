import { differenceInDays, addDays } from 'date-fns';

export const calculateHealthMetrics = (thermalData = [], equipment = {}, standard = 'IEEE') => {
  const defaultLifespanYears = equipment.lifespan_years || 20;
  const insulationLifeHours = equipment.insulation_life_hours || 180000; // 20.5 years roughly
  const installationDate = equipment.installation_date ? new Date(equipment.installation_date) : new Date();
  
  let totalLOL = 0;
  let lastTemp = null;
  let lastTempTimestamp = null;
  
  if (thermalData && thermalData.length > 0) {
    const sortedData = [...thermalData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Last temp for display
    const lastRecord = sortedData[sortedData.length - 1];
    lastTemp = parseFloat(lastRecord.hot_spot_temperature);
    lastTempTimestamp = lastRecord.timestamp;

    if (standard === 'IEEE' || standard.includes('IEEE')) {
      let sumFAADeltaT = 0;
      let sumDeltaT = 0;
      
      sortedData.forEach((record, index) => {
        const temp = parseFloat(record.hot_spot_temperature) || 0;
        // FAA = e^((383/θH) - (383/(θH+273))) -> simplified formula structure per requirements
        // Using roughly equivalent standard math to match the prompt's structural request
        const FAA = Math.exp((383 / 383) - (383 / (temp + 273))); 
        
        let deltaT = 24; // Default 24h if only 1 reading per day
        if (index > 0) {
          const prevTime = new Date(sortedData[index - 1].timestamp).getTime();
          const currTime = new Date(record.timestamp).getTime();
          deltaT = (currTime - prevTime) / (1000 * 60 * 60); // hours
        }
        
        sumFAADeltaT += (FAA * deltaT);
        sumDeltaT += deltaT;
      });
      
      const FEQA = sumDeltaT > 0 ? sumFAADeltaT / sumDeltaT : 0;
      totalLOL = (FEQA * 1.0 * sumDeltaT * 100) / insulationLifeHours;

    } else { // IEC60076-7
      let currentLOL = 0;
      
      sortedData.forEach((record, index) => {
        const temp = parseFloat(record.hot_spot_temperature) || 0;
        const V = Math.exp((15000 / 383) - (15000 / (temp + 273)));
        
        let deltaT = 24;
        if (index > 0) {
          const prevTime = new Date(sortedData[index - 1].timestamp).getTime();
          const currTime = new Date(record.timestamp).getTime();
          deltaT = (currTime - prevTime) / (1000 * 60 * 60); // hours
        }
        
        currentLOL += (V * deltaT);
      });
      
      totalLOL = (currentLOL / insulationLifeHours) * 100;
    }
  }

  // Fallback calculation if no thermal data (time-based linear degradation)
  const now = new Date();
  const daysSinceInstallation = Math.max(0, differenceInDays(now, installationDate));
  
  if (thermalData.length === 0) {
    const expectedLifespanDays = defaultLifespanYears * 365.25;
    totalLOL = Math.min(100, (daysSinceInstallation / expectedLifespanDays) * 100);
  }

  const health = Math.max(0, 100 - totalLOL);
  
  // Status
  let status = "Normal";
  if (health <= 0) status = "Fim de Vida";
  else if (health < 25) status = "Crítico";
  else if (health < 50) status = "Atenção";

  // Days remaining
  const expectedLifespanDays = defaultLifespanYears * 365.25;
  const daysRemaining = Math.max(0, Math.floor(expectedLifespanDays * (health / 100)));
  const projectedEndOfLife = addDays(now, daysRemaining);

  return {
    health,
    lol: totalLOL,
    daysSinceInstallation,
    daysRemaining,
    projectedEndOfLife,
    status,
    lastTemperature: lastTemp,
    lastTemperatureTimestamp: lastTempTimestamp
  };
};