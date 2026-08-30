import { useState, useEffect, useCallback } from 'react';
import { LifeBuoy, Plus, Clock, CheckCircle2 } from 'lucide-react';
import api from '../api/apiClient';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const CATEGORIES = ['Technical issue', 'Account', 'Feature request', 'Bug report', 'Other'];

export default function SupportTickets() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'Technical issue', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/ledger/chain/support_ticket/${deviceId}');
      setBlocks(res.data.blocks || []);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

   
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.subject || !form.description) return;
    setSaving(true);
    try {
      await api.post('/api/ledger/log', {
        entity_type: 'support_ticket',
        entity_id: deviceId,
        event_type: 'ticket_created',
        payload: { subject: form.subject, category: form.category, description: form.description, status: 'open' },
        actor: deviceId,
      });
      setForm({ subject: '', category: 'Technical issue', description: '' });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const tickets = [...blocks].reverse();

  return (
    <div>
      <PageHeader title={t('supportTicketsTitle')} icon={LifeBuoy} />
      <p className="text-xs text-text-secondary mb-3">
        Report an issue or ask for help. Every ticket is recorded so you can track its status over time.
      </p>

      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> New ticket
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label>{t('subject')}</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Short summary of the issue" />
            </div>
            <div>
              <Label>{t('category')}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('description')}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What went wrong, and what did you expect?" rows={4} />
            </div>
            <Button className="w-full" onClick={submit} disabled={saving || !form.subject || !form.description}>
              {saving ? 'Submitting…' : 'Submit ticket'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-text-muted text-center py-8">Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-text-muted">No tickets yet. Raise one above if you run into a problem.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((b) => (
            <Card key={b.index}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{b.payload?.subject}</p>
                  <Badge variant={b.payload?.status === 'resolved' ? 'success' : 'secondary'} className="flex items-center gap-1 text-[10px]">
                    {b.payload?.status === 'resolved' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {b.payload?.status || 'open'}
                  </Badge>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{b.payload?.category} · {new Date(b.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-xs text-text-secondary mt-1">{b.payload?.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
