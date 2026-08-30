import { useState, useEffect, useCallback } from 'react';
import { MessageSquareHeart, Star, Plus } from 'lucide-react';
import api from '../api/apiClient';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';


export default function FeedbackCorner() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/ledger/chain/feedback/${deviceId}');
      setBlocks(res.data.blocks || []);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

   
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!rating || !message.trim()) return;
    setSaving(true);
    try {
      await api.post('/api/ledger/log', {
        entity_type: 'feedback',
        entity_id: deviceId,
        event_type: 'feedback_submitted',
        payload: { rating, message: message.trim() },
        actor: deviceId,
      });
      setRating(0);
      setMessage('');
      setShowForm(false);
      setSubmitted(true);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const history = [...blocks].reverse();

  return (
    <div>
      <PageHeader title={t('feedbackCornerTitle')} icon={MessageSquareHeart} />
      <p className="text-xs text-gray-500 mb-3">
        Tell us what's working and what isn't. Your feedback shapes what gets built next.
      </p>

      {submitted && !showForm && (
        <Card className="mb-3 border-green-300 bg-green-50">
          <CardContent className="pt-3 text-sm text-green-800">Thank you — your feedback was recorded.</CardContent>
        </Card>
      )}

      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => { setShowForm((s) => !s); setSubmitted(false); }}>
          <Plus className="h-4 w-4 mr-1" /> Share feedback
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <p className="text-sm mb-1">How's your experience?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`}>
                    <Star className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What worked well, what didn't, what would you like to see?" rows={4} />
            <Button className="w-full" onClick={submit} disabled={saving || !rating || !message.trim()}>
              {saving ? 'Sending…' : 'Send feedback'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading your feedback history…</p>
      ) : history.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-gray-400">No feedback submitted yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {history.map((b) => (
            <Card key={b.index}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-3.5 w-3.5 ${n <= (b.payload?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                  <span className="text-[11px] text-gray-400 ml-2">{new Date(b.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <p className="text-xs text-gray-600">{b.payload?.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
