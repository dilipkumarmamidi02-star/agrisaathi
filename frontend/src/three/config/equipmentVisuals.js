/**
 * Equipment type -> visual mapping (spec #5 "data-driven configuration",
 * spec #41 "Equipment Registry": tractor / harvester / pump / sprayer /
 * tools). The farmer types a free-text `type` on EquipmentRegistry, so
 * this does keyword matching against real registered equipment instead
 * of requiring a fixed enum.
 */
export const EQUIPMENT_VISUALS = {
  tractor: { shape: 'tractor', color: '#c0392b', label: 'Tractor' },
  harvester: { shape: 'harvester', color: '#d68910', label: 'Harvester' },
  pump: { shape: 'pump', color: '#2e86c1', label: 'Pump' },
  sprayer: { shape: 'sprayer', color: '#27ae60', label: 'Sprayer' },
  tiller: { shape: 'tool', color: '#7d6608', label: 'Tiller' },
  plough: { shape: 'tool', color: '#7d6608', label: 'Plough' },
  default: { shape: 'tool', color: '#5d6d7e', label: 'Equipment' },
};

export function getEquipmentVisual(typeName) {
  if (!typeName) return EQUIPMENT_VISUALS.default;
  const key = typeName.trim().toLowerCase();
  const found = Object.keys(EQUIPMENT_VISUALS).find((k) => k !== 'default' && key.includes(k));
  return found ? EQUIPMENT_VISUALS[found] : EQUIPMENT_VISUALS.default;
}
