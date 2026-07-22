export const calculateIECAgingRate = (hotSpotTemp) => {
  if (hotSpotTemp === undefined || hotSpotTemp === null || isNaN(hotSpotTemp)) return 0;
  if (hotSpotTemp <= 0) return 0;
  const temp = hotSpotTemp > 200 ? 200 : hotSpotTemp;
  const exponent = (15000 / 383) - (15000 / (temp + 273));
  const rate = Math.exp(exponent);
  console.log(`[IEC Calc] Aging Rate input: ${hotSpotTemp}, output: ${rate}`);
  return isNaN(rate) || !isFinite(rate) ? 0 : rate;
};

export const calculateIECLossOfLife = (temperatureReadings, previousLOL = 0) => {
  if (!temperatureReadings || !Array.isArray(temperatureReadings) || temperatureReadings.length === 0) return previousLOL || 0;
  
  let cumulativeLOL = Number(previousLOL) || 0;
  
  temperatureReadings.forEach(reading => {
    const temp = Number(reading.temperature || reading.hot_spot_temperature || 0);
    const vn = calculateIECAgingRate(temp);
    const dtDays = Number(reading.timeInterval || (1/24)); 
    cumulativeLOL += (vn * dtDays);
  });
  
  console.log(`[IEC Calc] Cumulative LOL input count: ${temperatureReadings.length}, output: ${cumulativeLOL} days`);
  return isNaN(cumulativeLOL) || !isFinite(cumulativeLOL) ? previousLOL : cumulativeLOL;
};

export const calculateIECHealthPercentage = (cumulativeLOL, totalInsulationLifeDays) => {
  if (!totalInsulationLifeDays || totalInsulationLifeDays <= 0) return 100;
  const lolPercentage = (Number(cumulativeLOL) / Number(totalInsulationLifeDays)) * 100;
  if (isNaN(lolPercentage) || lolPercentage < 0) return 100;
  const health = Math.max(0, Math.min(100, 100 - lolPercentage));
  console.log(`[IEC Calc] Health % input (CumLOL:${cumulativeLOL}, Total:${totalInsulationLifeDays}), output: ${health}%`);
  return health;
};