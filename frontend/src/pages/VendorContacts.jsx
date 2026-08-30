import { useState, useEffect, useCallback } from 'react';
import { Phone, Plus, Store, Trash2 } from 'lucide-react';
import axios from 'axios';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const VENDOR_TYPES = ['Seed dealer', 'Fertilizer dealer', 'Pesticide dealer', 'Equipment rental', 'Buyer/Trader', 'Transport', 'Other'];

export default function VendorContacts() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Seed dealer', phone: '', location: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/ledger/chain/vendor_contact/${deviceId}`);
      setBlocks(res.data.blocks || []);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

   
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/ledger/log`, {
        entity_type: 'vendor_contact',
        entity_id: deviceId,
        event_type: 'vendor_added',
        payload: { ...form, active: true },
        actor: deviceId,
      });
      setForm({ name: '', type: 'Seed dealer', phone: '', location: '', notes: '' });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const removeVendor = async (name) => {
    await axios.post(`${API_URL}/api/ledger/log`, {
      entity_type: 'vendor_contact',
      entity_id: deviceId,
      event_type: 'vendor_removed',
      payload: { name, active: false },
      actor: deviceId,
    });
    await load();
  };

  // Latest state per vendor name; skip any whose latest event removed them.
  const latestByName = {};
  [...blocks].reverse().forEach((b) => {
    const name = b.payload?.name;
    if (name && !latestByName[name]) latestByName[name] = b;
  });
  const vendors = Object.values(latestByName).filter((b) => b.payload?.active);

  return (
    <div>
      <PageHeader title={t('vendorContactsTitle')} icon={Store} />
      <p className="text-xs text-gray-500 mb-3">
        Save the shops and buyers you deal with regularly, so their numbers are one tap away.
      </p>

      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> Add vendor
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label>{t('name')}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sri Ganesh Fertilizers" />
            </div>
            <div>
              <Label>{t('type')}</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('phoneNumber')}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 9876543210" />
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bowenpally market" />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Best price for urea" />
            </div>
            <Button className="w-full" onClick={submit} disabled={saving || !form.name || !form.phone}>
              {saving ? 'Saving…' : 'Save vendor'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading vendors…</p>
      ) : vendors.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-gray-400">No vendors saved yet. Add one above.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {vendors.map((b) => (
            <Card key={b.payload.name}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{b.payload.name}</p>
                  <p className="text-[11px] text-gray-400">{b.payload.type}{b.payload.location ? ` · ${b.payload.location}` : ''}</p>
                  {b.payload.notes && <p className="text-xs text-gray-500 mt-0.5">{b.payload.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${b.payload.phone}`} className="p-2 rounded-full bg-green-600 text-white" aria-label={`Call ${b.payload.name}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                  <button onClick={() => removeVendor(b.payload.name)} className="p-2 text-gray-400 hover:text-red-500" aria-label={`Remove ${b.payload.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
