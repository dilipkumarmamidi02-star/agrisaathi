import { useState, useEffect } from 'react'
import { Wheat, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';

export default function HarvestRecords() {
  const { t } = useLang();
  const [farms, setFarms] = useState([]);
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plot_name: '', crop_name: '', harvest_date: '', quantity: '', quantity_unit: 'quintal', area_harvested: '', quality_grade: '', sale_price_per_unit: '', season: '', notes: '' });

  const load = async () => {
    const [f, r] = await Promise.all([
      appClient.entities.Farm.list().catch(() => []),
      appClient.entities.HarvestRecord.list('-harvest_date', 200).catch(() => []),
    ]);
    setFarms(f); setRecords(r);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.plot_name || !form.crop_name || !form.harvest_date) return;
    await appClient.entities.HarvestRecord.create({
      ...form,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      area_harvested: form.area_harvested ? Number(form.area_harvested) : undefined,
      sale_price_per_unit: form.sale_price_per_unit ? Number(form.sale_price_per_unit) : undefined,
      quality_grade: form.quality_grade || undefined,
    });
    setForm({ plot_name: '', crop_name: '', harvest_date: '', quantity: '', quantity_unit: 'quintal', area_harvested: '', quality_grade: '', sale_price_per_unit: '', season: '', notes: '' });
    setShowForm(false);
    load();
  };
  const remove = async (id) => { await appClient.entities.HarvestRecord.delete(id); load(); };

  const plots = [...new Set(records.map((r) => r.plot_name).filter(Boolean))].sort();
  const [trendPlot, setTrendPlot] = useState('');
  useEffect(() => { if (plots.length && !trendPlot) setTrendPlot(plots[0]); }, [plots, trendPlot]);
  const trendData = records
    .filter((r) => r.plot_name === trendPlot && r.harvest_date && r.quantity != null)
    .sort((a, b) => new Date(a.harvest_date) - new Date(b.harvest_date))
    .map((r) => ({ date: new Date(r.harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), yield: r.quantity, crop: r.crop_name }));

  const totalQty = records.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalValue = records.reduce((sum, r) => sum + (r.quantity || 0) * (r.sale_price_per_unit || 0), 0);

  return (
    <div>
      <PageHeader titleKey="harvestRecords" icon={Wheat} />
      <p className="text-xs text-gray-500 mb-3">{t('harvestIntro')}</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Card><CardContent className="pt-3"><p className="text-xs text-gray-500">{t('totalHarvested')}</p><p className="text-lg font-bold text-green-700">{totalQty.toFixed(1)} q</p></CardContent></Card>
        <Card><CardContent className="pt-3"><p className="text-xs text-gray-500">{t('estValue')}</p><p className="text-lg font-bold text-green-700">₹{totalValue.toLocaleString('en-IN')}</p></CardContent></Card>
      </div>

      {records.length > 0 && (
        <Card className="mb-4"><CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Wheat className="h-4 w-4 text-green-600" />{t('yieldByCropSeason')}</h3>
          {(() => {
            const byKey = {};
            records.forEach((r) => {
              const key = `${r.crop_name || '—'}|${r.season || '—'}`;
              byKey[key] = (byKey[key] || 0) + (r.quantity || 0);
            });
            const chartData = Object.entries(byKey).map(([k, v]) => {
              const [crop, season] = k.split('|');
              return { name: `${crop}`, season, yield: Math.round(v * 10) / 10 };
            }).sort((a, b) => b.yield - a.yield);
            return (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v} q`} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="yield" fill="#16a34a" name={t('quantity')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </CardContent></Card>
      )}

      <Button onClick={() => setShowForm(!showForm)} className="w-full mb-3 bg-green-600 hover:bg-green-700">
        <Plus className="h-4 w-4" /> {t('logHarvest')}
      </Button>

      {showForm && (
        <Card className="mb-4"><CardContent className="pt-4 space-y-3">
          <div>
            <Label className="mb-1 block">{t('plotName')}</Label>
            <Select value={form.plot_name} onValueChange={(v) => {
              const f = farms.find((x) => x.plot_name === v);
              setForm({ ...form, plot_name: v, crop_name: f?.current_crop || '', area_harvested: f?.area_value || '' });
            }}>
              <SelectTrigger><SelectValue placeholder={t('selectPlot')} /></SelectTrigger>
              <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.plot_name}>{f.plot_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block">{t('cropName')}</Label><Input value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} /></div>
            <div><Label className="mb-1 block">{t('date')}</Label><Input type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block">{t('quantity')} (q)</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
            <div><Label className="mb-1 block">{t('areaHarvested')}</Label><Input type="number" value={form.area_harvested} onChange={(e) => setForm({ ...form, area_harvested: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block">{t('qualityGrade')}</Label>
              <Select value={form.quality_grade} onValueChange={(v) => setForm({ ...form, quality_grade: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="mb-1 block">{t('pricePerUnit')}</Label><Input type="number" value={form.sale_price_per_unit} onChange={(e) => setForm({ ...form, sale_price_per_unit: e.target.value })} /></div>
          </div>
          <Button onClick={submit} className="w-full bg-green-600 hover:bg-green-700">{t('save')}</Button>
        </CardContent></Card>
      )}

      {plots.length > 0 && (
        <Card className="mb-4"><CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-green-600" />{t('yieldTrend')}</h3>
          {plots.length > 1 && (
            <Select value={trendPlot} onValueChange={setTrendPlot}>
              <SelectTrigger className="h-8 text-sm mb-2"><SelectValue /></SelectTrigger>
              <SelectContent>{plots.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {trendData.length >= 2 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="yield" stroke="#16a34a" dot={{ r: 3 }} name={t('quantity')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-gray-400">{t('yieldTrendEmpty')}</p>
          )}
        </CardContent></Card>
      )}

      <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('history')}</h3>
      {records.length === 0 ? (
        <p className="text-xs text-gray-400">{t('noRecords')}</p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id}><CardContent className="pt-3 pb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.crop_name} · {r.plot_name}</p>
                <p className="text-xs text-gray-500">{r.harvest_date} · {r.quantity || 0} {r.quantity_unit}{r.sale_price_per_unit ? ` · ₹${r.sale_price_per_unit}/unit` : ''}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {r.quality_grade && <Badge className="bg-green-100 text-green-700">{r.quality_grade}</Badge>}
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <DataGovFeaturePanel feature="Harvest" />
    </div>
  );
}
