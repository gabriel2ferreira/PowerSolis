export const getHealthPercentage = (equipment) => {
  if (!equipment || !equipment.health) return 0;
  
  const apiConfig = equipment.equipment_api_config || equipment.api_config || equipment;
  const vidaRefAnos = parseFloat(apiConfig.vida_ref_anos || 25);
  
  return Math.max(0, Math.min((equipment.health.vidaRemanescenteAnos / vidaRefAnos) * 100, 100));
};