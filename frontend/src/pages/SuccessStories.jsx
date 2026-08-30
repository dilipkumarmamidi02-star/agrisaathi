import { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, Sprout } from 'lucide-react';
import axios from 'axios';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function SuccessStories() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ farmer_name: '', crop: '', story: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Shared feed — every farmer's story, not just this device's.
      const res = await axios.get(`${API_URL}/api/ledger/list/success_story`, { params: { limit: 50 } });
      setStories(res.data.blocks || []);
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

   
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.farmer_name || !form.crop || !form.story) return;
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/ledger/log`, {
        entity_type: 'success_story',
        entity_id: deviceId,
        event_type: 'story_shared',
        payload: form,
        actor: deviceId,
      });
      setForm({ farmer_name: '', crop: '', story: '' });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('successStoriesTitle')} icon={Trophy} />
      <p className="text-xs text-gray-500 mb-3">
        Real stories shared by farmers using AgriSaathi — visible to everyone.
      </p>

      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> Share your story
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label>{t('yourName')}</Label>
              <Input value={form.farmer_name} onChange={(e) => setForm({ ...form, farmer_name: e.target.value })} placeholder="e.g. Ravi Kumar" />
            </div>
            <div>
              <Label>{t('cropSingular')}</Label>
              <Input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} placeholder="e.g. Chilli" />
            </div>
            <div>
              <Label>{t('yourStory')}</Label>
              <Textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} placeholder="What changed, what worked, what would you tell other farmers?" rows={4} />
            </div>
            <Button className="w-full" onClick={submit} disabled={saving || !form.farmer_name || !form.crop || !form.story}>
              {saving ? 'Sharing…' : 'Share with the community'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading stories…</p>
      ) : stories.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-gray-400">No stories shared yet. Be the first!</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {stories.map((b) => (
            <Card key={b.hash}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sprout className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">{b.payload?.farmer_name} · {b.payload?.crop}</p>
                </div>
                <p className="text-xs text-gray-600">{b.payload?.story}</p>
                <p className="text-[11px] text-gray-400 mt-1">{new Date(b.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
