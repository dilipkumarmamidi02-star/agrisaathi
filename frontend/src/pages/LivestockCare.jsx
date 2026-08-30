import { useState, useEffect } from 'react'
import { Leaf, Plus, Check, Calendar } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import api from '../api/apiClient';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';

const CARE_TYPES = ['feed', 'health', 'milestone', 'vaccination'];

export default function LivestockCare() {
  const { t } = useLang();
  const [types, setTypes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ animal_type: '', care_type: 'feed', title: '', scheduled_date: '', notes: '' });

  const load = async () => {
    const [tpRes, lg] = await Promise.all([
      api.get('/api/livestock-types').catch(() => ({ data: [] })),
      appClient.entities.LivestockCareLog.list('-scheduled_date').catch(() => []),
    ]);
    setTypes(tpRes.data);
    setLogs(lg);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.animal_type || !form.title) { alert('Animal/type and title are required'); return; }
    const tp = types.find((x) => x.name_en === form.animal_type);
    await appClient.entities.LivestockCareLog.create({
      animal_type: form.animal_type,
      category: tp?.category || '',
      care_type: form.care_type,
      title: form.title,
      scheduled_date: form.scheduled_date || undefined,
      status: 'pending',
      notes: form.notes || undefined,
    });
    api.post('/api/ledger/log', {
      entity_type: 'livestock_care',
      entity_id: form.animal_type,
      event_type: 'care_logged',
      payload: { care_type: form.care_type, title: form.title },
    }).catch(() => {});
    setForm({ animal_type: '', care_type: 'feed', title: '', scheduled_date: '', notes: '' });
    setShowAdd(false);
    load();
  };

  const markDone = async (log) => {
    await appClient.entities.LivestockCareLog.update(log.id, { status: 'done', completed_date: new Date().toISOString().slice(0, 10) });
    api.post('/api/ledger/log', {
      entity_type: 'livestock_care',
      entity_id: log.animal_type,
      event_type: 'care_completed',
      payload: { title: log.title },
    }).catch(() => {});
    load();
  };

  const pending = logs.filter((l) => l.status === 'pending');
  const done = logs.filter((l) => l.status === 'done');

  const careColor = (c) => ({ feed: 'bg-blue-100 text-blue-700', health: 'bg-rose-100 text-rose-700', milestone: 'bg-purple-100 text-purple-700', vaccination: 'bg-teal-100 text-teal-700' }[c] || 'bg-gray-100');

  return (
    <div>
      <PageHeader titleKey="livestockCare" icon={Leaf} />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="bg-blue-50 border-blue-100"><CardContent className="pt-3 text-center"><div className="text-xl font-bold text-blue-700">{logs.filter((l) => l.care_type === 'feed').length}</div><div className="text-[10px] text-gray-500">{t('feed')}</div></CardContent></Card>
        <Card className="bg-rose-50 border-rose-100"><CardContent className="pt-3 text-center"><div className="text-xl font-bold text-rose-700">{logs.filter((l) => l.care_type === 'health').length}</div><div className="text-[10px] text-gray-500">{t('health')}</div></CardContent></Card>
        <Card className="bg-teal-50 border-teal-100"><CardContent className="pt-3 text-center"><div className="text-xl font-bold text-teal-700">{logs.filter((l) => l.care_type === 'vaccination').length}</div><div className="text-[10px] text-gray-500">{t('vaccination')}</div></CardContent></Card>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('pending')}</h3>
      <div className="space-y-2 mb-4">
        {pending.length === 0 ? <p className="text-sm text-gray-400">No pending care items.</p> : pending.map((l) => (
          <Card key={l.id}><CardContent className="pt-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className={careColor(l.care_type)}>{t(l.care_type)}</Badge>
                  <span className="text-xs text-gray-400">{l.animal_type}</span>
                </div>
                <p className="text-sm font-medium mt-1">{l.title}</p>
                {l.scheduled_date && <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />{l.scheduled_date}</p>}
                {l.notes && <p className="text-xs text-gray-500 mt-0.5">{l.notes}</p>}
              </div>
              <Button size="sm" onClick={() => markDone(l)} className="bg-green-600 hover:bg-green-700 shrink-0"><Check className="h-4 w-4" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('done')}</h3>
      <div className="space-y-2 mb-4">
        {done.map((l) => (
          <Card key={l.id} className="opacity-60"><CardContent className="pt-3">
            <div className="flex items-center gap-1.5"><Badge className="bg-gray-100 text-gray-500">{t(l.care_type)}</Badge><span className="text-xs text-gray-400">{l.animal_type}</span></div>
            <p className="text-sm line-through">{l.title}</p>
          </CardContent></Card>
        ))}
      </div>

      {showAdd ? (
        <Card className="border-green-200"><CardContent className="pt-4 space-y-3">
          <div><Label className="mb-1 block">{t('animalType')}</Label>
            <Select value={form.animal_type} onValueChange={(v) => setForm({ ...form, animal_type: v })}>
              <SelectTrigger><SelectValue placeholder={t('animalType')} /></SelectTrigger>
              <SelectContent className="max-h-72">{types.map((a) => <SelectItem key={a.id} value={a.name_en}>{a.name_en} · {a.category}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="mb-1 block">{t('careType')}</Label>
            <Select value={form.care_type} onValueChange={(v) => setForm({ ...form, care_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CARE_TYPES.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="mb-1 block">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning feed, FMD vaccine" /></div>
          <div><Label className="mb-1 block">{t('scheduledDate')}</Label><Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></div>
          <Textarea placeholder={t('notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button onClick={add} className="flex-1 bg-green-600 hover:bg-green-700">{t('save')}</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">{t('cancel')}</Button>
          </div>
        </CardContent></Card>
      ) : (
        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full border-green-300 text-green-700"><Plus className="h-4 w-4 mr-1" />{t('addEntry')}</Button>
      )}
    </div>
  );
}
