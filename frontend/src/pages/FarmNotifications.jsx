import { useState, useEffect, useCallback } from 'react';
import { BellRing, Plus, CheckCircle2, Circle } from 'lucide-react';
import api from '../api/apiClient';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';


export default function FarmNotifications() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', due_date: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/ledger/chain/farm_notification/${deviceId}');
      setBlocks(res.data.blocks || []);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

   
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title || !form.due_date) return;
    setSaving(true);
    try {
      await api.post('/api/ledger/log', {
        entity_type: 'farm_notification',
        entity_id: deviceId,
        event_type: 'reminder_created',
        payload: { ...form, done: false },
        actor: deviceId,
      });
      setForm({ title: '', due_date: '' });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const markDone = async (title, due_date) => {
    await api.post('/api/ledger/log', {
      entity_type: 'farm_notification',
      entity_id: deviceId,
      event_type: 'reminder_completed',
      payload: { title, due_date, done: true },
      actor: deviceId,
    });
    await load();
  };

  const latestByReminder = {};
  [...blocks].reverse().forEach((b) => {
    const key = `${b.payload?.title}__${b.payload?.due_date}`;
    if (key && !latestByReminder[key]) latestByReminder[key] = b;
  });
  const reminders = Object.values(latestByReminder).sort((a, b) => (a.payload.due_date || '').localeCompare(b.payload.due_date || ''));

  return (
    <div>
      <PageHeader title={t('farmNotificationsTitle')} icon={BellRing} />
      <p className="text-xs text-gray-500 mb-3">Set reminders for spraying, harvest, vaccination — anything with a date.</p>

      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> New reminder
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label>{t('reminder')}</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Spray fungicide on plot 2" />
            </div>
            <div>
              <Label>{t('dueDate')}</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <Button className="w-full" onClick={submit} disabled={saving || !form.title || !form.due_date}>
              {saving ? 'Saving…' : 'Save reminder'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading reminders…</p>
      ) : reminders.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-gray-400">No reminders set yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {reminders.map((b) => (
            <Card key={`${b.payload.title}-${b.payload.due_date}`} className={b.payload.done ? 'opacity-50' : ''}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <button onClick={() => !b.payload.done && markDone(b.payload.title, b.payload.due_date)} className="flex items-center gap-2 text-left flex-1">
                  {b.payload.done ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" /> : <Circle className="h-5 w-5 text-gray-300 shrink-0" />}
                  <div>
                    <p className={`text-sm font-medium ${b.payload.done ? 'line-through' : ''}`}>{b.payload.title}</p>
                    <p className="text-[11px] text-gray-400">{new Date(b.payload.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
