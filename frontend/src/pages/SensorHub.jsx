import {
  useState,
  useEffect
} from 'react'
import {
  Activity,
  Plus,
  Trash2,
  Radio
} from 'lucide-react';
import {
  useLang
} from '../lib/i18n';
import appClient from '../api/appClient';
import {
  Button
} from '../components/ui/button';
import {
  Card,
  CardContent
} from '../components/ui/card';
import {
  Label
} from '../components/ui/label';
import {
  Input
} from '../components/ui/input';
;
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import PageHeader from '../components/PageHeader';

export default function SensorHub() {
  const { t } = useLang();
  const [readings, setReadings] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ soil_ph: '', soil_moisture: '', soil_ec: '', soil_nitrogen: '', test_date: '' });

  const load = () => appClient.entities.SensorTest.list('-test_date', 30).then(setReadings).catch(() => []);
  useEffect(() => { load(); }, []);

  const save = async () => {
    await appClient.entities.SensorTest.create({
      test_type: 'soil',
      soil_ph: form.soil_ph ? Number(form.soil_ph) : undefined,
      soil_moisture: form.soil_moisture ? Number(form.soil_moisture) : undefined,
      soil_ec: form.soil_ec ? Number(form.soil_ec) : undefined,
      soil_nitrogen: form.soil_nitrogen ? Number(form.soil_nitrogen) : undefined,
      test_date: form.test_date || new Date().toISOString().slice(0, 10),
    });
    setForm({ soil_ph: '', soil_moisture: '', soil_ec: '', soil_nitrogen: '', test_date: '' });
    setShowAdd(false);
    load();
  };

  const remove = async (id) => { await appClient.entities.SensorTest.delete(id); load(); };

  const latest = readings[0];
  const trendData = readings
    .filter((r) => r.test_date)
    .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
    .map((r) => ({
      date: new Date(r.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      pH: r.soil_ph ?? null,
      Moisture: r.soil_moisture ?? null,
      EC: r.soil_ec ?? null,
      N: r.soil_nitrogen ?? null,
    }));

  return (
    <div>
      <PageHeader titleKey="sensorHub" icon={Activity} />
      <p className="text-xs text-text-secondary mb-3">{t('sensorHubIntro')}</p>

      {latest && (
        <Card className="mb-4 bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200"><CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-cyan-800 flex items-center gap-1.5 mb-2"><Radio className="h-4 w-4 animate-pulse" />{t('latestReading')}</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['pH', latest.soil_ph], ['Moisture', latest.soil_moisture], ['EC', latest.soil_ec], ['N', latest.soil_nitrogen]].map(([k, v]) => (
              <div key={k} className="bg-surface rounded-lg p-2">
                <div className="text-[10px] text-text-muted">{k}</div>
                <div className="text-sm font-bold text-cyan-700">{v ?? '—'}</div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {trendData.length >= 2 && (
        <Card className="mb-4"><CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2">{t('sensorTrend')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="pH" stroke="#16a34a" dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Moisture" stroke="#3b82f6" dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="EC" stroke="#f59e0b" dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="N" stroke="#a855f7" dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>
      )}

      <div className="space-y-2 mb-4">
        {readings.length === 0 ? (
          <p className="text-sm text-text-muted">{t('noReadings')}</p>
        ) : readings.map((r) => (
          <Card key={r.id}><CardContent className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">{r.test_date}</p>
              <p className="text-xs text-text-secondary">pH {r.soil_ph ?? '—'} · Moisture {r.soil_moisture ?? '—'} · EC {r.soil_ec ?? '—'} · N {r.soil_nitrogen ?? '—'}</p>
            </div>
            <button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          </CardContent></Card>
        ))}
      </div>

      {showAdd ? (
        <Card className="border-cyan-200"><CardContent className="pt-4 space-y-3">
          <Label>{t('addReading')}</Label>
          <div><Label className="mb-1 block text-xs">{t('date')}</Label><Input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block text-xs">pH</Label><Input type="number" value={form.soil_ph} onChange={(e) => setForm({ ...form, soil_ph: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">Moisture (%)</Label><Input type="number" value={form.soil_moisture} onChange={(e) => setForm({ ...form, soil_moisture: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">EC</Label><Input type="number" value={form.soil_ec} onChange={(e) => setForm({ ...form, soil_ec: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">Nitrogen</Label><Input type="number" value={form.soil_nitrogen} onChange={(e) => setForm({ ...form, soil_nitrogen: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1 bg-cyan-600 hover:bg-cyan-700">{t('save')}</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">{t('cancel')}</Button>
          </div>
        </CardContent></Card>
      ) : (
        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full border-cyan-300 text-cyan-700"><Plus className="h-4 w-4 mr-1" />{t('addReading')}</Button>
      )}
    </div>
  );
}
