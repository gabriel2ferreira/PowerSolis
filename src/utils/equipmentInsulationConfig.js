export const INSULATION_LIFE_DEFAULTS = {
  "Transformador": 150000,
  "Disjuntor": 100000,
  "Chave Seccionadora": 150000,
  "Pára-raios": 80000,
  "Isolador": 200000
};

export const getInsulationLifeHours = (equipmentType) => {
  if (!equipmentType) return 150000;
  return INSULATION_LIFE_DEFAULTS[equipmentType] || 150000;
};

export const getInsulationLifeDays = (equipmentType) => {
  return getInsulationLifeHours(equipmentType) / 24;
};

export const getDefaultAgingFactor = () => {
  return 1.0;
};

export const getDefaultReferenceTemperature = () => {
  return 110;
};