export const calculateAccelerationFactor = (currentTemp, refTemp = 55, thermalConstant = 9000) => {
  if (currentTemp === null || currentTemp === undefined) return 1.0;
  const tActualK = Number(currentTemp) + 273.15;
  const tRefK = Number(refTemp) + 273.15;
  const fA = Math.exp(thermalConstant * (1 / tRefK - 1 / tActualK));
  return Number(fA.toFixed(2));
};

export const calculateTimeBasedLoss = (installationDate) => {
  if (!installationDate) return 0;
  const install = new Date(installationDate);
  const now = new Date();
  const daysElapsed = (now - install) / (1000 * 3600 * 24);
  const dailyLoss = 100 / (25 * 365.25);
  const loss = Math.max(0, daysElapsed * dailyLoss);
  return Number(loss.toFixed(2));
};

export const calculateTemperatureBasedLoss = (temperatureHistory = [], refTemp = 55, thermalConstant = 9000) => {
  const dailyLoss = 100 / (25 * 365.25);
  let totalLoss = 0;
  
  // Sort history chronologically
  const sorted = [...temperatureHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  for (let i = 0; i < sorted.length; i++) {
    const fA = calculateAccelerationFactor(sorted[i].temperature, refTemp, thermalConstant);
    // Assuming each reading represents 1 day for simplicity in this utility
    totalLoss += (dailyLoss * fA);
  }
  
  return Number(totalLoss.toFixed(2));
};

export const calculateTCRemainingLifespan = (installationDate, temperatureHistory = [], refTemp = 55) => {
  const install = installationDate ? new Date(installationDate) : new Date();
  const timeLoss = calculateTimeBasedLoss(install);
  const tempLoss = calculateTemperatureBasedLoss(temperatureHistory, refTemp);
  
  // Simple combined loss logic - if temp history covers the whole period, use tempLoss, otherwise blend.
  // For this task, we will assume temperature history supplements time-based loss for the days it exists.
  // A simplified approach: we take base time loss and add extra degradation from temp where fA > 1.
  let combinedLoss = timeLoss;
  let avgFA = 1.0;
  
  if (temperatureHistory.length > 0) {
    let sumFA = 0;
    temperatureHistory.forEach(r => {
      sumFA += calculateAccelerationFactor(r.temperature, refTemp);
    });
    avgFA = sumFA / temperatureHistory.length;
    // Replace combined loss assuming average fA over the whole period
    combinedLoss = timeLoss * avgFA;
  }
  
  const totalLoss = Math.min(100, combinedLoss);
  const remainingPercentage = Math.max(0, 100 - totalLoss);
  
  const timeBasedEndDate = new Date(install.getTime() + (25 * 365.25 * 24 * 3600 * 1000));
  
  // Predict temp-based end date based on current average degradation rate
  let temperatureBasedEndDate = new Date(timeBasedEndDate);
  if (avgFA > 0) {
    const totalDaysLifespan = (25 * 365.25) / avgFA;
    temperatureBasedEndDate = new Date(install.getTime() + (totalDaysLifespan * 24 * 3600 * 1000));
  }
  
  const closestEndDate = temperatureBasedEndDate < timeBasedEndDate ? temperatureBasedEndDate : timeBasedEndDate;

  return {
    remainingPercentage: Number(remainingPercentage.toFixed(2)),
    timeBasedEndDate,
    temperatureBasedEndDate,
    closestEndDate,
    accelerationFactor: Number(avgFA.toFixed(2)),
    timeLoss: Number(timeLoss.toFixed(2)),
    tempLoss: Number((combinedLoss - timeLoss).toFixed(2)),
    healthStatus: getHealthStatus(remainingPercentage).status
  };
};

export const getAccelerationFactorStatus = (fA) => {
  const val = Number(fA);
  if (val < 1.0) return { status: 'Bom', color: 'green' };
  if (val <= 1.5) return { status: 'Atenção', color: 'yellow' };
  if (val <= 2.5) return { status: 'Crítico', color: 'red' };
  return { status: 'Crítico Severo', color: 'darkred' };
};

export const getHealthStatus = (remainingPercentage) => {
  const val = Number(remainingPercentage);
  if (val > 50) return { status: 'Bom', color: 'green' };
  if (val >= 25) return { status: 'Atenção', color: 'yellow' };
  return { status: 'Crítico', color: 'red' };
};

export const formatDuration = (days) => {
  if (days < 0) return "Expirado";
  const years = Math.floor(days / 365.25);
  const months = Math.floor((days % 365.25) / 30.44);
  const remainingDays = Math.floor((days % 365.25) % 30.44);
  return `${years} anos, ${months} meses, ${remainingDays} dias`;
};

export const formatTemperature = (temp) => {
  if (temp === null || temp === undefined) return "N/A";
  return `${Number(temp).toFixed(2)}°C`;
};

export const formatPercentage = (value) => {
  if (value === null || value === undefined) return "N/A";
  return `${Number(value).toFixed(2)}%`;
};