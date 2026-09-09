import { useMemo, useState } from 'react';
import { getFarmWeatherAdvice } from '../../lib/agriWeatherAdvisor';

const CROPS = [
  'General',
  'Paddy',
  'Wheat',
  'Maize',
  'Cotton',
  'Groundnut',
  'Chilli',
  'Tomato',
  'Vegetables',
  'Fruits',
];

const STAGES = [
  'General',
  'Planting',
  'Seedling',
  'Vegetative',
  'Flowering',
  'Fruit Development',
  'Maturity',
  'Harvesting',
];

const levelClasses = {
  critical: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  good: 'border-green-200 bg-green-50',
  info: 'border-blue-200 bg-blue-50',
};

const levelText = {
  critical: 'ACTION REQUIRED',
  warning: 'CAUTION',
  good: 'FAVORABLE',
  info: 'INFORMATION',
};

export default function WeatherFarmAdvisor({
  weather = {},
  crop: initialCrop = 'General',
  growthStage: initialStage = 'General',
}) {
  const [crop, setCrop] = useState(initialCrop || 'General');
  const [growthStage, setGrowthStage] = useState(
    initialStage || 'General'
  );

  const weatherData = useMemo(
    () => ({
      temperature:
        weather.temperature ??
        weather.temp ??
        weather.current?.temperature ??
        0,

      humidity:
        weather.humidity ??
        weather.current?.humidity ??
        0,

      rainfall:
        weather.rainfall ??
        weather.rainfallMm ??
        weather.rain ??
        weather.precipitation ??
        weather.current?.rainfall ??
        0,

      rainProbability:
        weather.rainProbability ??
        weather.precipitationProbability ??
        weather.current?.rainProbability ??
        0,

      windSpeed:
        weather.windSpeed ??
        weather.windKmh ??
        weather.current?.windSpeed ??
        0,

      windGust:
        weather.windGust ??
        weather.gustKmh ??
        weather.current?.windGust ??
        0,

      pressure:
        weather.pressure ??
        weather.pressureHpa ??
        weather.current?.pressure ??
        null,
    }),
    [weather]
  );

  const advice = useMemo(
    () =>
      getFarmWeatherAdvice({
        ...weatherData,
        crop,
        growthStage,
      }),
    [weatherData, crop, growthStage]
  );

  return (
    <section className="mt-6 rounded-3xl border border-green-100 bg-gradient-to-b from-green-50/70 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>

            <h2 className="text-xl font-bold text-[#1b4332]">
              Farm Weather Advisor
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Weather-based recommendations for your farm activities
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={crop}
            onChange={(event) => setCrop(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
            aria-label="Select crop"
          >
            {CROPS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={growthStage}
            onChange={(event) => setGrowthStage(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
            aria-label="Select crop growth stage"
          >
            {STAGES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
          🌡️ {weatherData.temperature}°C
        </span>

        <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
          💧 {weatherData.humidity}% humidity
        </span>

        <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
          🌧️ {weatherData.rainProbability}% rain
        </span>

        <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
          💨 {weatherData.windSpeed} km/h
        </span>

        {weatherData.pressure !== null && (
          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
            ⏱️ {weatherData.pressure} hPa
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {advice.alerts.map((alert) => (
          <article
            key={alert.category}
            className={`rounded-2xl border p-4 ${
              levelClasses[alert.level] || levelClasses.info
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{alert.icon}</span>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {alert.category}
                  </p>

                  <h3 className="text-sm font-bold text-gray-900">
                    {alert.title}
                  </h3>
                </div>
              </div>

              <span className="whitespace-nowrap rounded-full bg-white/80 px-2 py-1 text-[9px] font-bold">
                {levelText[alert.level] || 'INFO'}
              </span>
            </div>

            <p className="mt-3 text-sm leading-5 text-gray-600">
              {alert.reason}
            </p>

            <p className="mt-3 text-sm font-semibold text-gray-800">
              → {alert.action}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <p className="text-xs text-gray-500">
          Selected crop
        </p>

        <p className="mt-1 font-semibold text-[#1b4332]">
          {crop} · {growthStage}
        </p>

        <p className="mt-2 text-xs leading-5 text-gray-500">
          Recommendations use current weather conditions and forecast
          signals. Always follow crop-specific agricultural guidance,
          pesticide labels, soil conditions, and local advisories.
        </p>
      </div>
    </section>
  );
}
