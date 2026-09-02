/**
 * Category -> visual mapping shared by Input Marketplace (spec #42,
 * real `InputShop.category` values: fertilizer/seeds/equipment/
 * pesticide/general) and Resource Marketplace (spec #43, the same
 * five real-world input categories, just without a live shop list
 * behind them). One data-driven table instead of two near-duplicate
 * if/else ladders (spec #5).
 */
export const INPUT_CATEGORY_VISUALS = {
  fertilizer: { shape: 'sack', color: '#a16207', label: 'Fertilizer' },
  seeds: { shape: 'sack', color: '#65a30d', label: 'Seeds' },
  equipment: { shape: 'tool', color: '#64748b', label: 'Equipment' },
  'farm equipment': { shape: 'tool', color: '#64748b', label: 'Equipment' },
  pesticide: { shape: 'drum', color: '#0891b2', label: 'Pesticide' },
  general: { shape: 'crate', color: '#b45309', label: 'General store' },
  default: { shape: 'crate', color: '#8a8f66', label: 'Inputs' },
};

export function getInputCategoryVisual(category) {
  if (!category) return INPUT_CATEGORY_VISUALS.default;
  const key = category.trim().toLowerCase();
  if (INPUT_CATEGORY_VISUALS[key]) return INPUT_CATEGORY_VISUALS[key];
  const found = Object.keys(INPUT_CATEGORY_VISUALS).find(
    (k) => k !== 'default' && (key.includes(k) || k.includes(key))
  );
  return found ? INPUT_CATEGORY_VISUALS[found] : INPUT_CATEGORY_VISUALS.default;
}
