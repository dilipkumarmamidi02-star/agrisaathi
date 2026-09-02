import { getCropVisual } from './cropVisuals';

/**
 * Market/mandi scenes reuse the same crop→color mapping used by field
 * scenes (a tomato is still red whether it's growing in a field or
 * piled on a mandi stall) and add a produce "shape" on top, since a
 * market stall reads differently from a growing plant (spec #17: real
 * 3D mandi, dynamic per real commodity — not a generic decoration).
 */
const COMMODITY_SHAPE = {
  onion: 'sack',
  potato: 'sack',
  rice: 'sack',
  paddy: 'sack',
  wheat: 'sack',
  groundnut: 'sack',
  soybean: 'sack',
  cotton: 'bale',
  sugarcane: 'bundle',
  tomato: 'crate',
  chilli: 'crate',
  chili: 'crate',
  turmeric: 'crate',
  default: 'crate',
};

export function getCommodityVisual(commodityName) {
  const visual = getCropVisual(commodityName);
  const key = commodityName ? commodityName.trim().toLowerCase() : '';
  let shape = COMMODITY_SHAPE[key];
  if (!shape) {
    const partial = Object.keys(COMMODITY_SHAPE).find((k) => k !== 'default' && key.includes(k));
    shape = partial ? COMMODITY_SHAPE[partial] : COMMODITY_SHAPE.default;
  }
  return { ...visual, shape };
}

/**
 * WeatherAlerts.jsx (and any other page working from Open-Meteo's daily
 * forecast) gets WMO weather codes, not free-text descriptions — a
 * different real value than Home/Weather's `description` string, so it
 * needs its own mapper rather than reusing mapWeatherDescriptionToCondition.
 * Mirrors the WMO table already rendered in WeatherAlerts.jsx.
 */
export function mapWmoCodeToCondition(code) {
  if (code === null || code === undefined || Number.isNaN(Number(code))) return 'default';
  const c = Number(code);
  if (c >= 95) return 'storm';
  if ((c >= 51 && c <= 82) || (c >= 71 && c <= 75)) return 'rain';
  if (c === 45 || c === 48) return 'fog';
  if (c === 2 || c === 3) return 'cloudy';
  if (c === 0 || c === 1) return 'sunny';
  return 'default';
}
