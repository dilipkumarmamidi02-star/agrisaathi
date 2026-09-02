/**
 * ExpertDirectory.jsx's own EXPERT_TYPES list -> which domain each
 * card's small preview should reuse (spec #51: "crop expert -> crop
 * environment, livestock expert -> livestock environment, soil expert
 * -> soil environment"). The directory itself is a fixed, static list
 * (not user data), so only the *label* keys this map, not an id.
 */
export const EXPERT_VISUALS = {
  Agronomist: { reuse: 'crop', demoCrop: 'wheat', tone: '#65a30d' },
  Veterinarian: { reuse: 'livestock', demoCategory: 'dairy', tone: '#d97706' },
  'KVK Expert': { reuse: 'generic', tone: '#0891b2' },
  'Agriculture Officer': { reuse: 'scheme', tone: '#6366f1' },
  default: { reuse: 'generic', tone: '#8a8f66' },
};

export function getExpertVisual(title) {
  return EXPERT_VISUALS[title] || EXPERT_VISUALS.default;
}
