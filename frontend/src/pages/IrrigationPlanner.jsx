import { useState, useEffect } from 'react'
import { Droplets, Plus, Check, Trash2, Calendar } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';

const METHODS = ['drip', 'sprinkler', 'flood', 'furrow', 'rainfed'];

export default function IrrigationPlanner() {
  const { t } = useLang();
  const [farms, setFarms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plot_name: '', crop_name: '', session_date: '', duration_minutes: '', water_litres: '', method: 'drip', water_source: '', notes: '' });

  const load = async () => {
    const [f, s] = await Promise.all([
      appClient.entities.Farm.list().catch(() => []),
      appClient.entities.IrrigationSession.list('-session_date', 100).catch(() => []),
    ]);
    setFarms(f); setSessions(s);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.plot_name || !form.session_date) return;
    await appClient.entities.IrrigationSession.create({
      ...form,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      water_litres: form.water_litres ? Number(form.water_litres) : undefined,
      status: 'scheduled',
    });
    setForm({ plot_name: '', crop_name: '', session_date: '', duration_minutes: '', water_litres: '', method: 'drip', water_source: '', notes: '' });
    setShowForm(false);
    load();
  };

  const markDone = async (id) => { await appClient.entities.IrrigationSession.update(id, { status: 'done' }); load(); };
  const remove = async (id) => { await appClient.entities.IrrigationSession.delete(id); load(); };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sessions.filter((s) => s.status === 'scheduled' && s.session_date >= today);
  const past = sessions.filter((s) => s.status !== 'scheduled' || s.session_date < today);

  return (
    <div>
      <PageHeader titleKey="irrigationPlanner" icon={Droplets} />
      <p className="text-xs text-text-secondary mb-3">{t('irrigationIntro')}</p>

      <Button onClick={() => setShowForm(!showForm)} className="w-full mb-3 bg-green-600 hover:bg-green-700">
        <Plus className="h-4 w-4" /> {t('logIrrigation')}
      </Button>

      {showForm && (
        <Card className="mb-4"><CardContent className="pt-4 space-y-3">
          <div>
            <Label className="mb-1 block">{t('plotName')}</Label>
            <Select value={form.plot_name} onValueChange={(v) => {
              const f = farms.find((x) => x.plot_name === v);
              setForm({ ...form, plot_name: v, crop_name: f?.current_crop || '' });
            }}>
              <SelectTrigger><SelectValue placeholder={t('selectPlot')} /></SelectTrigger>
              <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.plot_name}>{f.plot_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block">{t('cropName')}</Label><Input value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} /></div>
            <div><Label className="mb-1 block">{t('date')}</Label><Input type="date" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block">{t('durationMin')}</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
            <div><Label className="mb-1 block">{t('waterLitres')}</Label><Input type="number" value={form.water_litres} onChange={(e) => setForm({ ...form, water_litres: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block">{t('method')}</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{t(m)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="mb-1 block">{t('waterSource')}</Label><Input value={form.water_source} onChange={(e) => setForm({ ...form, water_source: e.target.value })} placeholder="borewell / canal" /></div>
          </div>
          <Button onClick={submit} className="w-full bg-green-600 hover:bg-green-700">{t('save')}</Button>
        </CardContent></Card>
      )}

      {upcoming.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-1"><Calendar className="h-4 w-4" />{t('upcomingSessions')}</h3>
          <div className="space-y-2">
            {upcoming.map((s) => (
              <Card key={s.id}><CardContent className="pt-3 pb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.plot_name} · {s.crop_name || '—'}</p>
                  <p className="text-xs text-text-secondary">{s.session_date} · {t(s.method)} · {s.water_litres ? `${s.water_litres}L` : ''}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => markDone(s.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-text-secondary mb-2">{t('history')}</h3>
      {past.length === 0 ? (
        <p className="text-xs text-text-muted">{t('noRecords')}</p>
      ) : (
        <div className="space-y-2">
          {past.map((s) => (
            <Card key={s.id}><CardContent className="pt-3 pb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.plot_name} · {s.crop_name || '—'}</p>
                <p className="text-xs text-text-secondary">{s.session_date} · {t(s.method)}{s.water_litres ? ` · ${s.water_litres}L` : ''}</p>
              </div>
              <Badge className={s.status === 'done' ? 'bg-mint/20 text-mint' : 'bg-surface-hover text-text-secondary'}>{t(s.status)}</Badge>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
