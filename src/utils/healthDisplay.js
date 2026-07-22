
export const getHealthPercentage = (equipment) => {
  if (!equipment || !equipment.health) return 0;
  
  // ✅ FIXED: Use percentage already calculated by calculateEquipmentHealth (single source of truth)
  if (equipment.health.percentage != null) {
    return Math.max(0, Math.min(Number(equipment.health.percentage), 100));
  }
  
  // Fallback: recalculate if percentage not available
  const apiConfig = equipment.equipment_api_config || equipment.api_config || equipment;
  const vidaRefAnos = parseFloat(apiConfig?.vida_ref_anos ?? 25);
  if (!vidaRefAnos) return 0;
  
  return Math.max(0, Math.min((equipment.health.vidaRemanescenteAnos / vidaRefAnos) * 100, 100));
};
