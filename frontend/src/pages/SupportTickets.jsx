import { useState, useEffect, useCallback } from 'react';
import { LifeBuoy, Plus, Clock, CheckCircle2 } from 'lucide-react';
import api from '../api/apiClient';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import DynamicScenePhoto from '../components/DynamicScenePhoto';
import { useLang } from '../lib/i18n';

const CATEGORIES = [
  'Technical issue',
  'Account',
  'Feature request',
  'Bug report',
  'Other',
];

export default function SupportTickets() {
  const { t } = useLang();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    subject: '',
    category: 'Technical issue',
    description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/api/grievances/mine');

      const data = res.data || {};

      setTickets(
        Array.isArray(data)
          ? data
          : data.grievances || data.items || []
      );
    } catch (err) {
      setTickets([]);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to load support tickets.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    const subject = form.subject.trim();
    const description = form.description.trim();

    if (!subject || !description) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/api/grievances', {
        subject,
        category: form.category,
        description,
        priority: 'normal',
      });

      setForm({
        subject: '',
        category: 'Technical issue',
        description: '',
      });

      setShowForm(false);

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to submit the support ticket.'
      );
    } finally {
      setSaving(false);
    }
  };

  const openCount = tickets.filter(
    (ticket) =>
      !['resolved', 'rejected'].includes(
        String(ticket.status || 'open').toLowerCase()
      )
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) =>
      ['resolved', 'rejected'].includes(
        String(ticket.status || '').toLowerCase()
      )
  ).length;

  return (
    <div>
      <PageHeader
        title={t('supportTicketsTitle')}
        icon={LifeBuoy}
      />

      <DynamicScenePhoto
        fallbackQuery="customer support helpdesk"
        openCount={openCount}
        resolvedCount={resolvedCount}
      />

      <p className="text-xs text-lt-text-secondary mb-3">
        Report an issue or ask for help. Every ticket is recorded
        in your AgriSaathi support history so you can track its status.
      </p>

      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-3">
        <Button
          size="sm"
          onClick={() => setShowForm((s) => !s)}
        >
          <Plus className="h-4 w-4 mr-1" />
          New ticket
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">

            <div>
              <Label>{t('subject')}</Label>

              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm({
                    ...form,
                    subject: e.target.value,
                  })
                }
                placeholder="Short summary of the issue"
              />
            </div>

            <div>
              <Label>{t('category')}</Label>

              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    category: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('description')}</Label>

              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="What went wrong, and what did you expect?"
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              onClick={submit}
              disabled={
                saving ||
                !form.subject.trim() ||
                !form.description.trim()
              }
            >
              {saving ? 'Submitting…' : 'Submit ticket'}
            </Button>

          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-lt-text-muted text-center py-8">
          Loading tickets…
        </p>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-lt-text-muted">
            No tickets yet. Raise one above if you run into a problem.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">

          {tickets.map((ticket) => {
            const status =
              String(ticket.status || 'open').toLowerCase();

            const resolved =
              status === 'resolved' ||
              status === 'rejected';

            return (
              <Card
                key={ticket.id || ticket.ticket_id}
              >
                <CardContent className="pt-3 pb-3">

                  <div className="flex items-center justify-between gap-3">

                    <div>
                      <p className="text-sm font-medium">
                        {ticket.subject || 'Support ticket'}
                      </p>

                      <p className="text-[11px] text-lt-text-muted mt-0.5">
                        {ticket.ticket_id || ticket.grievance_id || ticket.id}
                        {' · '}
                        {ticket.category || 'Other'}
                      </p>
                    </div>

                    <Badge
                      variant={resolved ? 'success' : 'secondary'}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      {resolved ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}

                      {status}
                    </Badge>

                  </div>

                  {ticket.created_at && (
                    <p className="text-[11px] text-lt-text-muted mt-1">
                      {new Date(
                        ticket.created_at
                      ).toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </p>
                  )}

                  <p className="text-xs text-lt-text-secondary mt-1">
                    {ticket.description || ''}
                  </p>

                  {ticket.admin_notes && (
                    <div className="mt-2 rounded-lg bg-lt-bg p-2">
                      <p className="text-[11px] font-medium text-lt-text">
                        Admin response
                      </p>

                      <p className="text-xs text-lt-text-secondary mt-1">
                        {ticket.admin_notes}
                      </p>
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}

        </div>
      )}
    </div>
  );
}
