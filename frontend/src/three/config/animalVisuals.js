/**
 * Category → visual mapping for every animal category in
 * animalEncyclopedia.json. Mirrors cropVisuals.js's philosophy: add a
 * category once, every scene (Livestock herd view, Animal Encyclopedia
 * browse preview, Animal Encyclopedia detail showcase) picks it up.
 *
 * No GLB models were available in this environment, so `body` describes
 * a procedural low-poly shape recipe rather than a model path — see
 * AnimalModel.jsx for how each recipe is actually built.
 */
export const ANIMAL_VISUALS = {
  dairy: {
    label: 'Dairy',
    bodyColor: '#f5f0e6',
    patchColor: '#3a3a3a',
    legColor: '#e8e0d0',
    bodySize: [0.62, 0.4, 0.32],
    legHeight: 0.28,
    hasHorns: true,
    groundColor: '#5a4630',
  },
  'goat-sheep': {
    label: 'Goat & Sheep',
    bodyColor: '#e8e2d5',
    patchColor: '#c9c0aa',
    legColor: '#d8cfc0',
    bodySize: [0.4, 0.28, 0.24],
    legHeight: 0.18,
    hasHorns: true,
    groundColor: '#6b7a52',
  },
  poultry: {
    label: 'Poultry',
    bodyColor: '#f2e9d8',
    patchColor: '#e11d48',
    legColor: '#eab308',
    bodySize: [0.2, 0.2, 0.18],
    legHeight: 0.08,
    hasHorns: false,
    groundColor: '#8a7550',
  },
  piggery: {
    label: 'Piggery',
    bodyColor: '#f3b6c2',
    patchColor: '#e88ea0',
    legColor: '#e8a3b3',
    bodySize: [0.48, 0.3, 0.28],
    legHeight: 0.14,
    hasHorns: false,
    groundColor: '#6b5a42',
  },
  rabbit: {
    label: 'Rabbit',
    bodyColor: '#f5f5f0',
    patchColor: '#d8d8d0',
    legColor: '#eeeee6',
    bodySize: [0.22, 0.18, 0.16],
    legHeight: 0.06,
    hasHorns: false,
    groundColor: '#7a8a5a',
  },
  fisheries: {
    label: 'Fisheries',
    bodyColor: '#5fa8c9',
    patchColor: '#2d6a8a',
    legColor: null,
    bodySize: [0.3, 0.12, 0.1],
    legHeight: 0,
    hasHorns: false,
    groundColor: '#1e3a4a',
    water: true,
  },
  apiculture: {
    label: 'Apiculture',
    bodyColor: '#e8a93d',
    patchColor: '#2a2a2a',
    legColor: null,
    bodySize: [0.06, 0.06, 0.06],
    legHeight: 0,
    hasHorns: false,
    groundColor: '#6b5a42',
    hive: true,
  },
  default: {
    label: 'Livestock',
    bodyColor: '#e8e2d5',
    patchColor: '#c9c0aa',
    legColor: '#d8cfc0',
    bodySize: [0.4, 0.28, 0.24],
    legHeight: 0.18,
    hasHorns: false,
    groundColor: '#6b7a52',
  },
};

export function getAnimalVisual(categoryId) {
  if (!categoryId) return ANIMAL_VISUALS.default;
  const key = categoryId.trim().toLowerCase();
  return ANIMAL_VISUALS[key] || ANIMAL_VISUALS.default;
}

/**
 * Given the real per-species totals a page already computes (Livestock.jsx
 * has totalCattle/totalBuffalo/totalSheep/totalGoat/totalPoultry/totalPig),
 * pick which category is dominant. Returns null if every total is zero
 * (nothing to show — spec's empty-state rule, not a fabricated default).
 */
export function dominantAnimalCategory(totals) {
  const groups = {
    dairy: (totals.cattle || 0) + (totals.buffalo || 0),
    'goat-sheep': (totals.sheep || 0) + (totals.goat || 0),
    poultry: totals.poultry || 0,
    piggery: totals.pig || 0,
  };
  const entries = Object.entries(groups).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
