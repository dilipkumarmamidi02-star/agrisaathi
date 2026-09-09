const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function getFarmWeatherAdvice({
  temperature = 0,
  humidity = 0,
  rainfall = 0,
  rainProbability = 0,
  windSpeed = 0,
  windGust = 0,
  pressure = null,
  crop = 'General',
  growthStage = 'General',
}) {
  const temp = toNumber(temperature);
  const hum = toNumber(humidity);
  const rain = toNumber(rainfall);
  const rainChance = toNumber(rainProbability);
  const wind = toNumber(windSpeed);
  const gust = toNumber(windGust);

  const pressureValue =
    pressure === null || pressure === undefined
      ? null
      : toNumber(pressure);

  const heavyRain = rain >= 15 || rainChance >= 80;
  const rainExpected = rain >= 5 || rainChance >= 50;
  const strongWind = wind >= 20 || gust >= 30;
  const extremeWind = wind >= 30 || gust >= 45;
  const veryHot = temp >= 40;
  const hot = temp >= 35;
  const highHumidity = hum >= 85;
  const lowHumidity = hum > 0 && hum <= 35;

  const alerts = [];

  if (heavyRain) {
    alerts.push({
      category: 'Pesticide',
      icon: '🦠',
      level: 'critical',
      title: 'Do not spray pesticides now',
      reason: 'Heavy rain is expected.',
      action: 'Wait for a dry weather window.',
    });
  } else if (strongWind) {
    alerts.push({
      category: 'Pesticide',
      icon: '🦠',
      level: 'critical',
      title: 'Avoid pesticide spraying',
      reason: 'Wind conditions may cause spray drift.',
      action: 'Wait until wind becomes calmer.',
    });
  } else if (rainExpected) {
    alerts.push({
      category: 'Pesticide',
      icon: '🦠',
      level: 'warning',
      title: 'Delay pesticide spraying',
      reason: 'Rain is possible during the current period.',
      action: 'Choose a dry hourly window.',
    });
  } else {
    alerts.push({
      category: 'Pesticide',
      icon: '🦠',
      level: 'good',
      title: 'Spraying conditions look favorable',
      reason: 'No major rain or wind restriction detected.',
      action: 'Follow the pesticide label and recommended dose.',
    });
  }

  if (heavyRain) {
    alerts.push({
      category: 'Fertilizer',
      icon: '🧪',
      level: 'warning',
      title: 'Delay fertilizer application',
      reason: 'Heavy rain can cause nutrient runoff.',
      action: 'Apply after the heavy-rain window.',
    });
  } else if (hot) {
    alerts.push({
      category: 'Fertilizer',
      icon: '🧪',
      level: 'warning',
      title: 'Use caution with fertilizer',
      reason: 'High temperatures can increase crop stress.',
      action: 'Prefer cooler hours and adequate soil moisture.',
    });
  } else {
    alerts.push({
      category: 'Fertilizer',
      icon: '🧪',
      level: 'good',
      title: 'Fertilizer application weather is favorable',
      reason: 'No major weather restriction detected.',
      action: 'Follow crop-stage and soil-test recommendations.',
    });
  }

  if (heavyRain || rainChance >= 70) {
    alerts.push({
      category: 'Irrigation',
      icon: '💧',
      level: 'good',
      title: 'Delay irrigation',
      reason: 'Rainfall is likely to provide water.',
      action: 'Check soil moisture before irrigating.',
    });
  } else if (hot || lowHumidity) {
    alerts.push({
      category: 'Irrigation',
      icon: '💧',
      level: 'warning',
      title: 'Check irrigation requirement',
      reason: 'Dry or hot conditions may increase water demand.',
      action: 'Check soil moisture and irrigate if required.',
    });
  } else {
    alerts.push({
      category: 'Irrigation',
      icon: '💧',
      level: 'info',
      title: 'Monitor soil moisture',
      reason: 'Weather does not indicate an urgent irrigation need.',
      action: 'Use soil moisture and crop stage for the final decision.',
    });
  }

  if (heavyRain) {
    alerts.push({
      category: 'Planting',
      icon: '🌱',
      level: 'critical',
      title: 'Avoid planting during heavy rain',
      reason: 'Excess rainfall can create poor field conditions.',
      action: 'Wait until the field becomes workable.',
    });
  } else if (veryHot) {
    alerts.push({
      category: 'Planting',
      icon: '🌱',
      level: 'warning',
      title: 'Avoid planting during extreme heat',
      reason: 'High temperature can stress new plants.',
      action: 'Prefer a cooler suitable planting window.',
    });
  } else {
    alerts.push({
      category: 'Planting',
      icon: '🌱',
      level: 'good',
      title: 'Planting conditions look favorable',
      reason: 'No major weather restriction detected.',
      action: 'Confirm soil moisture and crop requirements.',
    });
  }

  if (extremeWind || veryHot) {
    alerts.push({
      category: 'Seedling',
      icon: '🌿',
      level: 'warning',
      title: 'Protect seedlings',
      reason: 'Heat or strong wind can increase transplant stress.',
      action: 'Prefer cooler and calmer conditions.',
    });
  } else if (heavyRain) {
    alerts.push({
      category: 'Seedling',
      icon: '🌿',
      level: 'warning',
      title: 'Delay transplanting if fields are waterlogged',
      reason: 'Excess rainfall can make field conditions unsuitable.',
      action: 'Wait for workable soil conditions.',
    });
  } else {
    alerts.push({
      category: 'Seedling',
      icon: '🌿',
      level: 'good',
      title: 'Seedling conditions look favorable',
      reason: 'No major weather stress detected.',
      action: 'Continue normal crop-stage management.',
    });
  }

  if (heavyRain) {
    alerts.push({
      category: 'Harvest',
      icon: '🌾',
      level: 'critical',
      title: 'Harvest mature crops before rain if possible',
      reason: 'Significant rainfall is expected.',
      action: 'Prioritize crops that are already mature.',
    });
  } else if (rainExpected) {
    alerts.push({
      category: 'Harvest',
      icon: '🌾',
      level: 'warning',
      title: 'Plan harvesting around the rain',
      reason: 'Rain may interrupt harvesting and drying.',
      action: 'Use available dry-weather windows.',
    });
  } else {
    alerts.push({
      category: 'Harvest',
      icon: '🌾',
      level: 'good',
      title: 'Harvest conditions look favorable',
      reason: 'No significant rainfall restriction detected.',
      action: 'Harvest mature crops during suitable hours.',
    });
  }

  if (heavyRain || highHumidity) {
    alerts.push({
      category: 'Picking',
      icon: '🥕',
      level: 'warning',
      title: 'Be careful with fruit and vegetable picking',
      reason: 'Wet or highly humid conditions may affect produce handling.',
      action: 'Prefer a dry period and protect harvested produce.',
    });
  } else {
    alerts.push({
      category: 'Picking',
      icon: '🥕',
      level: 'good',
      title: 'Picking conditions look favorable',
      reason: 'Dryer conditions are currently available.',
      action: 'Pick mature produce during cooler hours where practical.',
    });
  }

  if (pressureValue !== null) {
    if (pressureValue < 1000) {
      alerts.push({
        category: 'Pressure',
        icon: '⏱️',
        level: 'info',
        title: 'Lower atmospheric pressure',
        reason: 'Weather may become unsettled.',
        action: 'Monitor rainfall and wind forecasts closely.',
      });
    } else if (pressureValue > 1025) {
      alerts.push({
        category: 'Pressure',
        icon: '⏱️',
        level: 'info',
        title: 'Higher atmospheric pressure',
        reason: 'Conditions may be relatively stable.',
        action: 'Continue monitoring the forecast.',
      });
    }
  }

  return {
    crop,
    growthStage,
    conditions: {
      temperature: temp,
      humidity: hum,
      rainfall: rain,
      rainProbability: rainChance,
      windSpeed: wind,
      windGust: gust,
      pressure: pressureValue,
    },
    alerts,
  };
}
