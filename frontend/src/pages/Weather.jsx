import { useState, useEffect } from 'react'
import api from '../api/apiClient';
import { CloudSun, Wind, Droplets, MapPin } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';


export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function fetchWeather(lat, lon) {
    setLoading(true);
    setError(null);
    api.get('/api/weather/current', { params: { lat, lon } })
      .then((res) => setWeather(res.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Could not fetch weather'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchWeather(17.385, 78.4867);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(17.385, 78.4867)
    );
  }, []);

  return (
    <div>
      <PageHeader titleKey="weather" icon={CloudSun} />

      {loading && <p className="text-sm text-text-muted">Loading weather...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

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
      <DataGovFeaturePanel feature="Weather" />
    </div>
  );
}
