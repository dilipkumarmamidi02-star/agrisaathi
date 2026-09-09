import { useState, useEffect } from 'react'
import api from '../api/apiClient';
import { CloudSun, Wind, Droplets, MapPin, Sunrise, Sunset, Gauge } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';
import PageBackdrop from '../components/PageBackdrop';
import { usePageContext } from '../contexts/AgricultureContext';
import { mapWeatherDescriptionToCondition } from '../three/config/cropVisuals';
import WeatherFarmAdvisor from '../components/weather/WeatherFarmAdvisor';

const AQI_COLORS = {
  1: 'text-green-600 bg-green-50',
  2: 'text-lime-600 bg-lime-50',
  3: 'text-yellow-600 bg-yellow-50',
  4: 'text-orange-600 bg-orange-50',
  5: 'text-red-600 bg-red-50',
};

function formatHour(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString([], { weekday: 'short' });
}

function formatClock(unixSeconds) {
  if (!unixSeconds) return '--';
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const weatherCondition = weather?.description
    ? mapWeatherDescriptionToCondition(weather.description)
    : 'default';

  usePageContext({ page: 'weather', weather: weatherCondition });

  function fetchAll(lat, lon) {
    setLoading(true);
    setError(null);

    Promise.allSettled([
      api.get('/api/weather/current', { params: { lat, lon } }),
      api.get('/api/weather/forecast', { params: { lat, lon } }),
      api.get('/api/weather/air-quality', { params: { lat, lon } }),
    ]).then(([currentRes, forecastRes, aqRes]) => {
      if (currentRes.status === 'fulfilled') setWeather(currentRes.value.data);
      else setError(currentRes.reason?.response?.data?.detail || 'Could not fetch weather');

      if (forecastRes.status === 'fulfilled') setForecast(forecastRes.value.data);
      if (aqRes.status === 'fulfilled') setAirQuality(aqRes.value.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchAll(17.385, 78.4867);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchAll(pos.coords.latitude, pos.coords.longitude),
      () => fetchAll(17.385, 78.4867)
    );
  }, []);

  return (
    <div>
      <PageHeader titleKey="weather" icon={CloudSun} />

      {loading && !weather && (
        <Card className="bg-blue-600/40 text-white mb-4 animate-pulse">
          <CardContent className="pt-5 pb-5">
            <div className="h-4 w-24 bg-white/30 rounded mb-2" />
            <div className="h-10 w-20 bg-white/30 rounded mb-2" />
            <div className="h-4 w-32 bg-white/30 rounded" />
          </CardContent>
        </Card>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <PageBackdrop query={weatherCondition} />

      {weather && (
        <Card className="bg-blue-600 text-white mb-4">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
              <MapPin className="h-3 w-3" /> {weather.location || 'Your location'}
            </div>
            <div className="text-4xl font-bold">{Math.round(weather.temperature)}°C</div>
            <div className="text-sm capitalize opacity-90">{weather.description}</div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> {weather.humidity}%</span>
              <span className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" /> {weather.wind_speed} m/s</span>
              {weather.rain_1h != null && <span>Rain: {weather.rain_1h}mm/h</span>}
            </div>
            {weather.feels_like != null && (
              <div className="text-xs opacity-70 mt-1">Feels like {Math.round(weather.feels_like)}°C</div>
            )}
          </CardContent>
        </Card>
      )}

      {forecast?.hourly?.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-lt-text-muted uppercase mb-3">Next hours</p>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {forecast.hourly.map((h, i) => (
                <div key={i} className="flex flex-col items-center min-w-[56px]">
                  <span className="text-xs text-lt-text-muted">{i === 0 ? 'Now' : formatHour(h.time)}</span>
                  <img
                    src={`https://openweathermap.org/img/wn/${h.icon}.png`}
                    alt={h.description}
                    className="w-8 h-8"
                  />
                  <span className="text-sm font-semibold">{Math.round(h.temp)}°</span>
                  {h.pop > 10 && <span className="text-[10px] text-blue-500">{Math.round(h.pop)}%</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {forecast?.days?.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-lt-text-muted uppercase mb-3">5-day forecast</p>
            <div className="space-y-2">
              {forecast.days.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="w-12 font-medium">{i === 0 ? 'Today' : formatDay(d.date)}</span>
                  <img
                    src={`https://openweathermap.org/img/wn/${d.icon}.png`}
                    alt={d.description}
                    className="w-7 h-7"
                  />
                  <span className="w-12 text-xs text-blue-500 text-right">
                    {d.rain_probability > 5 ? `${Math.round(d.rain_probability)}%` : ''}
                  </span>
                  <span className="w-20 text-right text-lt-text-muted">
                    {Math.round(d.temp_min)}° / {Math.round(d.temp_max)}°
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {airQuality && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-lt-text-muted uppercase mb-2 flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" /> Air Quality
              </p>
              <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${AQI_COLORS[airQuality.aqi] || ''}`}>
                {airQuality.aqi_label}
              </span>
              {airQuality.pm2_5 != null && (
                <p className="text-xs text-lt-text-muted mt-2">PM2.5: {airQuality.pm2_5.toFixed(1)} µg/m³</p>
              )}
              {airQuality.pm10 != null && (
                <p className="text-xs text-lt-text-muted">PM10: {airQuality.pm10.toFixed(1)} µg/m³</p>
              )}
            </CardContent>
          </Card>
        )}

        {weather && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-lt-text-muted uppercase mb-2 flex items-center gap-1">
                <Sunrise className="h-3.5 w-3.5" /> Sun
              </p>
              
        {weather && (
          <WeatherFarmAdvisor
            weather={{
              temperature: weather.temperature,
              humidity: weather.humidity,
              rainfall: weather.rain_1h,
              rainProbability:
                weather.rain_probability ??
                weather.precipitation_probability ??
                weather.pop ??
                0,
              windSpeed: weather.wind_speed,
              windGust:
                weather.wind_gust ??
                weather.wind_gust_speed ??
                0,
              pressure:
                weather.pressure ??
                weather.pressure_hpa ??
                null,
            }}
          />
        )}

        <p className="text-sm">Rise: {formatClock(weather.sunrise)}</p>
              <p className="text-sm flex items-center gap-1"><Sunset className="h-3.5 w-3.5" /> Set: {formatClock(weather.sunset)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <DataGovFeaturePanel feature="Weather" />
    </div>
  );
}
