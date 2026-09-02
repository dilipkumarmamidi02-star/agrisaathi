/**
 * CommunityForum.jsx's own CATEGORIES list ('Crops','Livestock','Soil',
 * 'Weather','Market','Schemes','Equipment','Other') -> a subtle color
 * only. Spec #50 "Community Forum ... 3D remains subtle" and #82's
 * usability-first rule, so this never grows past a small header strip.
 */
export const COMMUNITY_CATEGORY_VISUALS = {
  Crops: { shape: 'leaf', color: '#22c55e' },
  Livestock: { shape: 'animal', color: '#d97706' },
  Soil: { shape: 'layer', color: '#78350f' },
  Weather: { shape: 'cloud', color: '#38bdf8' },
  Market: { shape: 'stall', color: '#f97316' },
  Schemes: { shape: 'shield', color: '#6366f1' },
  Equipment: { shape: 'tool', color: '#64748b' },
  Other: { shape: 'dot', color: '#8a8f66' },
};

export function getCommunityVisual(category) {
  return COMMUNITY_CATEGORY_VISUALS[category] || COMMUNITY_CATEGORY_VISUALS.Other;
}
