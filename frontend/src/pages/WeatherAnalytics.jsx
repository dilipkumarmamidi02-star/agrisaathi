import { useEffect, useState } from 'react';

import {
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  MapPin,
  RefreshCw,
} from 'lucide-react';

import axios from 'axios';

import {
  Card,
  CardContent,
} from '../components/ui/card';

import {
  Button,
} from '../components/ui/button';

import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8001';

const DEFAULT_LOCATION = {
  lat: 17.385,
  lon: 78.4867,
};

export default function WeatherAnalytics() {
  const { t } = useLang();
  const [current, setCurrent] =
    useState(null);

  const [days, setDays] =
    useState([]);

  const [error, setError] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const loadWeather = () => {
    setLoading(true);
    setError(null);

    const fetchForLocation = (
      lat,
      lon
    ) =>
      Promise.all([
        axios.get(
          `${API_URL}/api/weather/current`,
          {
            params: { lat, lon },
          }
        ),

        axios.get(
          `${API_URL}/api/weather/forecast`,
          {
            params: { lat, lon },
          }
        ),
      ])
        .then(([currentResponse, forecastResponse]) => {
          setCurrent(currentResponse.data);

          setDays(
            forecastResponse.data?.days || []
          );
        })
        .catch((err) => {
          setError(
            err?.response?.data?.detail ||
              'Weather analytics unavailable. Check the backend weather provider.'
          );
        })
        .finally(() => {
          setLoading(false);
        });

    if (!navigator.geolocation) {
      return fetchForLocation(
        DEFAULT_LOCATION.lat,
        DEFAULT_LOCATION.lon
      );
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        fetchForLocation(
          position.coords.latitude,
          position.coords.longitude
        ),

      () =>
        fetchForLocation(
          DEFAULT_LOCATION.lat,
          DEFAULT_LOCATION.lon
        ),

      {
        timeout: 5000,
      }
    );
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const highRainDays =
    days.filter(
      (day) =>
        Number(day.rain_probability) >= 60
    ).length;

  return (
    <div>
      <PageHeader
        title={t('weatherAnalyticsTitle')}
        icon={CloudRain}
      />

      <div className="flex justify-end mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={loadWeather}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-gray-400">
          Loading weather analytics…
        </p>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 mb-3">
          <CardContent className="pt-4 text-sm text-red-700">
            {error}
          </CardContent>
        </Card>
      )}

      {current && (
        <>
          <Card className="mb-3">
            <CardContent className="pt-4">

              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {current.location ||
                  'Your location'}
              </p>

              <div className="grid grid-cols-3 gap-2 mt-3">

                <div>
                  <Thermometer className="h-4 w-4" />

                  <p className="text-lg font-bold">
                    {Math.round(
                      current.temperature
                    )}°C
                  </p>

                  <p className="text-[11px] text-gray-400">
                    Temperature
                  </p>
                </div>

                <div>
                  <Droplets className="h-4 w-4" />

                  <p className="text-lg font-bold">
                    {current.humidity ?? '—'}%
                  </p>

                  <p className="text-[11px] text-gray-400">
                    Humidity
                  </p>
                </div>

                <div>
                  <Wind className="h-4 w-4" />

                  <p className="text-lg font-bold">
                    {current.wind_speed ?? '—'}
                  </p>

                  <p className="text-[11px] text-gray-400">
                    Wind m/s
                  </p>
                </div>

              </div>

            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">

              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-sm">
                  5-day forecast
                </p>

                <span className="text-xs text-gray-500">
                  {highRainDays} high-rain day
                  {highRainDays === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-2">

                {days.map((day) => (
                  <div
                    key={day.date}
                    className="border rounded-lg p-3 flex justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {day.date}
                      </p>

                      <p className="text-xs text-gray-500">
                        {day.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {Math.round(day.temp_min)}
                        –
                        {Math.round(day.temp_max)}
                        °C
                      </p>

                      <p className="text-xs text-blue-600">
                        {Math.round(
                          day.rain_probability
                        )}% rain
                      </p>
                    </div>
                  </div>
                ))}

              </div>

            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
