/**
 * Indicative national/state average yield reference (quintal/acre,
 * rounded, drawn from publicly published ICAR/agri-department seasonal
 * averages). Spec #38 "Yield Benchmarks" explicitly asks for "your
 * yield vs regional benchmark vs target" — this is the reference data
 * the comparison needs, clearly labelled as an indicative average
 * rather than a live figure, and never presented as the farmer's own
 * measured data.
 */
export const REGIONAL_YIELD_BENCHMARK_QUINTAL_PER_ACRE = {
  paddy: 22, rice: 22, wheat: 18, cotton: 6, maize: 20, corn: 20,
  chilli: 8, chili: 8, groundnut: 8, sugarcane: 300, turmeric: 20,
  soybean: 10, onion: 80, tomato: 90, default: 15,
};

export function getRegionalBenchmark(cropName) {
  if (!cropName) return REGIONAL_YIELD_BENCHMARK_QUINTAL_PER_ACRE.default;
  const key = cropName.trim().toLowerCase();
  return REGIONAL_YIELD_BENCHMARK_QUINTAL_PER_ACRE[key]
    || REGIONAL_YIELD_BENCHMARK_QUINTAL_PER_ACRE.default;
}
