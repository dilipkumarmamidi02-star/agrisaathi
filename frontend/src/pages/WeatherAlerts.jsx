import { useCallback,  useState } from 'react'
import { CloudRain, AlertTriangle, Sun, Cloud, Droplets, Wind, Navigation, Loader2 } from 'lucide-react';
import { useLang } from '../lib/i18n';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import PageHeader from '../components/PageHeader';

const WMO = {
  0: { label: 'Clear', icon: Sun, color: 'text-amber-500' },
  1: { label: 'Mainly clear', icon: Sun, color: 'text-amber-500' },
  2: { label: 'Partly cloudy', icon: Cloud, color: 'text-text-muted' },
  3: { label: 'Overcast', icon: Cloud, color: 'text-text-muted' },
  45: { label: 'Fog', icon: Cloud, color: 'text-text-muted' },
  48: { label: 'Rime fog', icon: Cloud, color: 'text-text-muted' },
  51: { label: 'Light drizzle', icon: CloudRain, color: 'text-blue-400' },
  53: { label: 'Drizzle', icon: CloudRain, color: 'text-blue-400' },
  55: { label: 'Heavy drizzle', icon: CloudRain, color: 'text-blue-500' },
  61: { label: 'Light rain', icon: CloudRain, color: 'text-blue-400' },
  63: { label: 'Rain', icon: CloudRain, color: 'text-blue-500' },
  65: { label: 'Heavy rain', icon: CloudRain, color: 'text-blue-600' },
  71: { label: 'Light snow', icon: Cloud, color: 'text-cyan-400' },
  73: { label: 'Snow', icon: Cloud, color: 'text-cyan-500' },
  75: { label: 'Heavy snow', icon: Cloud, color: 'text-cyan-600' },
  80: { label: 'Rain showers', icon: CloudRain, color: 'text-blue-500' },
  81: { label: 'Heavy showers', icon: CloudRain, color: 'text-blue-600' },
  82: { label: 'Violent showers', icon: CloudRain, color: 'text-cyan-400' },
  95: { label: 'Thunderstorm', icon: AlertTriangle, color: 'text-red-500' },
  96: { label: 'Thunderstorm + hail', icon: AlertTriangle, color: 'text-red-600' },
  99: { label: 'Severe thunderstorm', icon: AlertTriangle, color: 'text-red-600' },
};

export default function WeatherAlerts() {
  const { t } = useLang();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crops] = useState([]);
  const [error, setError] = useState('');

  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) { setError(t('geoUnsupported')); setLoading(false); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=5`;
        const res = await fetch(url);
        const data = await res.json();
        setForecast(data.daily);
      } catch { setError(t('weatherFailed')); } finally { setLoading(false); }
    }, () => { setError(t('locationDenied')); setLoading(false); });
  }, [t]);

  const plantedCrops = crops.filter((c) => c.status === 'growing' || c.status === 'sown').map((c) => c.crop_name).filter(Boolean);
  const days = forecast?.time || [];
  const extremes = days.map((d, i) => {
    const code = forecast.weather_code[i];
    const rain = forecast.precipitation_sum?.[i] || 0;
    const wind = forecast.wind_speed_10m_max?.[i] || 0;
    const tempMax = forecast.temperature_2m_max?.[i] || 0;
    const alerts = [];
    if (code >= 95) alerts.push(t('thunderstormAlert'));
    if (rain >= 30) alerts.push(t('heavyRainAlert'));
    if (wind >= 40) alerts.push(t('highWindAlert'));
    if (tempMax >= 40) alerts.push(t('heatwaveAlert'));
    return { date: d, code, rain, wind, tempMax, tempMin: forecast.temperature_2m_min?.[i], alerts };
  }).filter((d) => d.alerts.length > 0);

  const cropImpact = extremes.length > 0 && plantedCrops.length > 0
    ? `${t('cropImpactPrefix')} ${plantedCrops.join(', ')}. ${t('cropImpactAdvice')}`
    : null;

  return (
    <div>
      <PageHeader titleKey="weatherAlerts" icon={CloudRain} />
      <p className="text-xs text-text-secondary mb-3">{t('weatherAlertsIntro')}</p>

      <Button onClick={fetchWeather} variant="outline" size="sm" className="mb-3"><Navigation className="h-3 w-3 mr-1" />{t('refresh')}</Button>

      {plantedCrops.length > 0 && (
        <Card className="mb-3 bg-mint/10 border-green-200"><CardContent className="pt-3">
          <p className="text-xs font-semibold text-mint mb-1">{t('currentlyPlanted')}</p>
          <div className="flex flex-wrap gap-1.5">{plantedCrops.map((c, i) => <Badge key={i} className="bg-mint/20 text-mint">{c}</Badge>)}</div>
        </CardContent></Card>
      )}

      {loading && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>}
      {error && <Card><CardContent className="pt-6 text-center text-sm text-red-500">{error}</CardContent></Card>}

      {extremes.length > 0 && (
        <Card className="mb-3 border-red-200 bg-red-500/10"><CardContent className="pt-3 space-y-2">
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />{t('extremeAlerts')}</h3>
          {extremes.map((d, i) => (
            <div key={i} className="bg-surface rounded-lg p-2">
              <p className="text-xs font-semibold text-red-600">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              {d.alerts.map((a, j) => <p key={j} className="text-xs text-red-600">• {a}</p>)}
            </div>
          ))}
          {cropImpact && <div className="bg-amber-500/10 rounded-lg p-2 text-xs text-amber-400 border border-amber-200">{cropImpact}</div>}
        </CardContent></Card>
      )}

      {forecast && !loading && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-2">{t('fiveDayForecast')}</h3>
          <div className="space-y-2">
            {days.map((d, i) => {
              const w = WMO[forecast.weather_code[i]] || { label: '—', icon: Cloud, color: 'text-text-muted' };
              const Icon = w.icon;
              return (
                <Card key={d}><CardContent className="pt-3 pb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-7 w-7 ${w.color}`} />
                    <div>
                      <p className="text-sm font-medium">{new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}</p>
                      <p className="text-xs text-text-secondary">{w.label}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-text-secondary space-y-0.5">
                    <p className="text-sm font-semibold text-text-primary">{Math.round(forecast.temperature_2m_max?.[i])}° / {Math.round(forecast.temperature_2m_min?.[i])}°</p>
                    <p className="flex items-center justify-end gap-1"><Droplets className="h-3 w-3 text-blue-400" />{(forecast.precipitation_sum?.[i] || 0).toFixed(1)}mm</p>
                    <p className="flex items-center justify-end gap-1"><Wind className="h-3 w-3" />{Math.round(forecast.wind_speed_10m_max?.[i] || 0)}km/h</p>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
