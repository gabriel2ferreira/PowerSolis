export const calculateIEEEAccelerationFactor = (hotSpotTemp) => {
  if (hotSpotTemp === undefined || hotSpotTemp === null || isNaN(hotSpotTemp)) return 0;
  if (hotSpotTemp <= 0) return 0;
  const temp = hotSpotTemp > 200 ? 200 : hotSpotTemp;
  const exponent = (15000 / 383) - (15000 / (temp + 273)); // Corrected IEEE formula approximation
  const factor = Math.exp(exponent);
  console.log(`[IEEE Calc] Accel Factor input: ${hotSpotTemp}, output: ${factor}`);
  return isNaN(factor) || !isFinite(factor) ? 0 : factor;
};

export const calculateIEEEEquivalentAgingFactor = (temperatureReadings) => {
  if (!temperatureReadings || !Array.isArray(temperatureReadings) || temperatureReadings.length === 0) return 0;
  
  let sumFAADeltaT = 0;
  let sumDeltaT = 0;

  temperatureReadings.forEach(reading => {
    const temp = Number(reading.temperature || reading.hot_spot_temperature || 0);
    const faa = calculateIEEEAccelerationFactor(temp);
    const dt = Number(reading.timeStep || 1);
    sumFAADeltaT += (faa * dt);
    sumDeltaT += dt;
  });

  const equivalentAging = sumDeltaT > 0 ? (sumFAADeltaT / sumDeltaT) : 0;
  console.log(`[IEEE Calc] Eq Aging Factor input count: ${temperatureReadings.length}, output: ${equivalentAging}`);
  return isNaN(equivalentAging) || !isFinite(equivalentAging) ? 0 : equivalentAging;
};

export const calculateIEEELossOfLife = (FEQA, agingFactor, insulationLifeHours) => {
  if (!insulationLifeHours || insulationLifeHours <= 0) return 0;
  const factor = agingFactor || 1.0;
  const lol = (FEQA * factor * 100) / insulationLifeHours;
  console.log(`[IEEE Calc] LOL input (FEQA:${FEQA}, life:${insulationLifeHours}), output: ${lol}%`);
  return isNaN(lol) || !isFinite(lol) ? 0 : Math.max(0, lol);
};

export const calculateIEEEHealthPercentage = (LOL) => {
  if (isNaN(LOL) || LOL < 0) return 100;
  const health = Math.max(0, Math.min(100, 100 - LOL));
  console.log(`[IEEE Calc] Health % input (LOL:${LOL}), output: ${health}%`);
  return health;
};