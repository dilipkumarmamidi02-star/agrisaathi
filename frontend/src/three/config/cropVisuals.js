/**
 * Central crop → visual mapping. Every scene that needs to render "a
 * field of X" reads from here instead of hardcoding if/else chains
 * (spec #5 "Scene configuration must be data-driven").
 *
 * Add a crop here once and every module (Dashboard field patches, Crops
 * environment, Crop Planner, Harvest Records, ...) picks it up.
 */
export const CROP_VISUALS = {
  paddy: { color: '#8fd14f', accent: '#e8f2c8', height: 0.35, density: 'dense', water: true },
  rice: { color: '#8fd14f', accent: '#e8f2c8', height: 0.35, density: 'dense', water: true },
  wheat: { color: '#e3c565', accent: '#f5e6a8', height: 0.55, density: 'dense', water: false },
  cotton: { color: '#c9d6c3', accent: '#ffffff', height: 0.5, density: 'medium', water: false },
  maize: { color: '#6fae3a', accent: '#d9c94a', height: 0.9, density: 'medium', water: false },
  corn: { color: '#6fae3a', accent: '#d9c94a', height: 0.9, density: 'medium', water: false },
  chilli: { color: '#3f7d34', accent: '#c23b22', height: 0.3, density: 'medium', water: false },
  chili: { color: '#3f7d34', accent: '#c23b22', height: 0.3, density: 'medium', water: false },
  groundnut: { color: '#5a7d3a', accent: '#c99a54', height: 0.2, density: 'dense', water: false },
  sugarcane: { color: '#4f9d3d', accent: '#dcefc4', height: 1.2, density: 'dense', water: true },
  turmeric: { color: '#4d8b2e', accent: '#e8a33d', height: 0.4, density: 'medium', water: false },
  rose: { color: '#3d6b35', accent: '#e0527a', height: 0.4, density: 'medium', water: false },
  tomato: { color: '#4a7d3a', accent: '#e0402f', height: 0.35, density: 'medium', water: false },
  onion: { color: '#5f8a3f', accent: '#c98fd6', height: 0.25, density: 'dense', water: false },
  soybean: { color: '#5e9c3c', accent: '#cfe7ab', height: 0.3, density: 'dense', water: false },
  default: { color: '#6fae3a', accent: '#d9e8b0', height: 0.4, density: 'medium', water: false },
};

export function getCropVisual(cropName) {
  if (!cropName) return CROP_VISUALS.default;
  const key = cropName.trim().toLowerCase();
  return CROP_VISUALS[key] || CROP_VISUALS.default;
}

/** Weather → lighting/sky mapping used by any scene that reacts to weather. */
export const WEATHER_VISUALS = {
  sunny: { sky: '#bfe3ff', ground: '#123a1c', light: '#fff3d6', intensity: 1.1, fog: null },
  cloudy: { sky: '#9fb0ba', ground: '#0f2c1a', light: '#dfe6ea', intensity: 0.75, fog: '#8fa2ab' },
  rain: { sky: '#5c6b73', ground: '#0a2015', light: '#c7d3d8', intensity: 0.55, fog: '#6b7a82' },
  storm: { sky: '#333c42', ground: '#081812', light: '#9aa7ad', intensity: 0.4, fog: '#3a4348' },
  fog: { sky: '#c7cfd1', ground: '#0f2c1a', light: '#dadedf', intensity: 0.6, fog: '#c7cfd1' },
  default: { sky: '#bfe3ff', ground: '#123a1c', light: '#fff3d6', intensity: 1.0, fog: null },
};

export function getWeatherVisual(weather) {
  if (!weather) return WEATHER_VISUALS.default;
  return WEATHER_VISUALS[weather.toLowerCase()] || WEATHER_VISUALS.default;
}
