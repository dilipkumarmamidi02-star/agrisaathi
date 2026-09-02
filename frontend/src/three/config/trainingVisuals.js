/**
 * Training Center categories (crop/livestock/soil/irrigation/machinery/
 * marketing, from TrainingCenter.jsx's own CATEGORIES list) mapped to
 * *which already-built scene to reuse* (spec #47: "organic farming ->
 * organic field demonstration, irrigation -> irrigation demonstration,
 * pest management -> crop/pest lab, machinery -> equipment
 * demonstration"). Nothing here is a new 3D world — every category
 * mounts a scene Phases 2-7 already shipped, illustrating the *topic*
 * rather than any specific farmer's real records (same honesty
 * contract as Speak to AgriSaathi's topic scenes).
 */
export const TRAINING_SCENE_MAP = {
  crop: { reuse: 'crop', demoCrop: 'rice', tone: 'green' },
  livestock: { reuse: 'livestock', demoCategory: 'dairy', tone: 'amber' },
  soil: { reuse: 'soil', tone: 'brown' },
  irrigation: { reuse: 'irrigation', tone: 'blue' },
  machinery: { reuse: 'machinery', tone: 'slate' },
  marketing: { reuse: 'market', tone: 'orange' },
  default: { reuse: 'crop', demoCrop: 'rice', tone: 'green' },
};

export function getTrainingVisual(category) {
  return TRAINING_SCENE_MAP[category] || TRAINING_SCENE_MAP.default;
}
