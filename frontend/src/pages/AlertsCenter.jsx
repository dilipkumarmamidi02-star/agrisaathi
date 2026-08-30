import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, CloudRain, TrendingUp } from 'lucide-react';
import api from '../api/apiClient';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';


export default function AlertsCenter() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [forecastDays, setForecastDays] = useState([]);
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/ledger/chain/inventory/${deviceId}');
      const blocks = res.data.blocks || [];
      const latestByItem = {};
      [...blocks].reverse().forEach((b) => {
        const item = b.payload?.item;
        if (item && !latestByItem[item]) latestByItem[item] = b;
      });
      const low = Object.values(latestByItem).filter(
        (b) => b.payload?.low_stock_at != null && b.payload.quantity <= b.payload.low_stock_at
      );
      setLowStockItems(low);
    } catch {
      setLowStockItems([]);
    }

    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation
          ? navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          : reject(new Error('no geolocation'))
      );
      const { latitude, longitude } = pos.coords;
      const fRes = await api.get('/api/weather/forecast', { params: { lat: latitude, lon: longitude } });
      const risky = (fRes.data.days || []).filter((d) => d.rain_probability >= 60);
      setForecastDays(risky);
    } catch {
      setForecastDays([]);
    }

    try {
      const pRes = await api.get('/api/price-alerts');
      setPriceAlerts(pRes.data.alerts || []);
    } catch {
      setPriceAlerts([]);
    }

    setLoading(false);
  }, [deviceId]);

   
  useEffect(() => { load(); }, [load]);

  const totalAlerts = lowStockItems.length + forecastDays.length + priceAlerts.length;

  return (
    <div>
      <PageHeader title={t('alertsCenterTitle')} icon={Bell} />
      <p className="text-xs text-text-secondary mb-3">
        {totalAlerts > 0
          ? `${totalAlerts} alert${totalAlerts > 1 ? 's' : ''} need your attention.`
          : 'No active alerts right now.'}
      </p>

      {/* Low stock — real, from Inventory Tracker */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Low Stock
        </p>
        {loading ? (
          <p className="text-sm text-text-muted">Checking inventory…</p>
        ) : lowStockItems.length === 0 ? (
          <Card><CardContent className="pt-4 text-sm text-text-muted">Nothing running low.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {lowStockItems.map((b) => (
              <Card key={b.payload.item} className="border-amber-300 bg-amber-500/10">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium text-amber-900">{b.payload.item}</p>
                  <p className="text-xs text-amber-400">{b.payload.quantity} {b.payload.unit} left · threshold {b.payload.low_stock_at}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Weather risk — not yet available; backend only fetches current
          conditions, not a forecast. Being upfront instead of faking data. */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1">
          <CloudRain className="h-4 w-4 text-blue-500" /> Weather Risk
        </p>
        {loading ? (
          <p className="text-sm text-text-muted">Checking forecast…</p>
        ) : forecastDays.length === 0 ? (
          <Card><CardContent className="pt-4 text-sm text-text-muted">No high rain risk in the next 5 days.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {forecastDays.map((d) => (
              <Card key={d.date} className="border-blue-300 bg-cyan-500/10">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium text-blue-900">{d.date} · {Math.round(d.rain_probability)}% rain chance</p>
                  <p className="text-xs text-cyan-400">{d.description} · {Math.round(d.temp_min)}–{Math.round(d.temp_max)}°C</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Price alerts — not yet available; no price history is stored yet
          to compute a % change against. */}
      <div>
        <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-green-600" /> Price Changes
        </p>
        {loading ? (
          <p className="text-sm text-text-muted">Checking prices…</p>
        ) : priceAlerts.length === 0 ? (
          <Card><CardContent className="pt-4 text-sm text-text-muted">
            No price swings of 5% or more recorded yet. Alerts build up as prices are checked over time — visit Market Prices a few times to start tracking changes.
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {priceAlerts.map((p) => (
              <Card key={`${p.market}-${p.commodity}`} className={p.direction === 'up' ? 'border-mint/40 bg-mint/10' : 'border-red-300 bg-red-500/10'}>
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium">{p.commodity} — {p.market}</p>
                  <p className={`text-xs ${p.direction === 'up' ? 'text-mint' : 'text-red-400'}`}>
                    ₹{p.previous_price} → ₹{p.current_price} ({p.direction === 'up' ? '+' : ''}{p.pct_change}%)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
