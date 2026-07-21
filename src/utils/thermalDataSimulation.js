export const generateRealisticTemperatureProfile = (equipmentType, daysToGenerate = 30) => {
  const baseTemps = {
    "Transformador": 70,
    "Disjuntor": 45,
    "Chave Seccionadora": 40,
    "Pára-raios": 35,
    "Isolador": 30
  };
  
  const baseTemp = baseTemps[equipmentType] || 60;
  const data = [];
  const now = new Date();

  for (let i = daysToGenerate; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const seasonal = Math.sin((date.getMonth() / 11) * Math.PI) * 12;
    const dailyNoise = (Math.random() * 4) - 2;
    const temperature = baseTemp + seasonal + dailyNoise;
    
    data.push({
      date,
      temperature: Math.max(0, parseFloat(temperature.toFixed(2)))
    });
  }
  
  return data;
};

export const generateTemperatureReadingsForDateRange = (startDate, endDate, baseTemp = 70) => {
  const data = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const hour = current.getHours();
    // Peak temperature usually around 14:00 - 16:00
    const dailyCycle = -Math.cos((hour / 24) * 2 * Math.PI) * 10;
    const noise = (Math.random() * 4) - 2;
    const temperature = baseTemp + dailyCycle + noise;

    data.push({
      timestamp: new Date(current),
      temperature: Math.max(0, parseFloat(temperature.toFixed(2)))
    });

    // Increment by 1 hour
    current = new Date(current.getTime() + 60 * 60 * 1000);
  }
  
  return data;
};