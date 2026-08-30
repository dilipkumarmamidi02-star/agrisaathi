import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import api from '../api/apiClient';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const CATEGORIES = ['Seed', 'Fertilizer', 'Pesticide', 'Equipment', 'Fuel', 'Other'];
const UNITS = ['kg', 'litre', 'bag', 'unit', 'packet'];

export default function InventoryTracker() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [blocks, setBlocks] = useState([]);
  const [valid, setValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ item: '', category: 'Seed', quantity: '', unit: 'kg', low_stock_at: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/ledger/chain/inventory-tracker/${deviceId}');
      setBlocks(res.data.blocks || []);
      setValid(res.data.valid);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

   
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.item || !form.quantity) return;
    setSaving(true);
    try {
      await api.post('/api/ledger/log', {
        entity_type: 'inventory',
        entity_id: deviceId,
        event_type: 'stock_update',
        payload: {
          item: form.item,
          category: form.category,
          quantity: Number(form.quantity),
          unit: form.unit,
          low_stock_at: form.low_stock_at ? Number(form.low_stock_at) : null,
        },
        actor: deviceId,
      });
      setForm({ item: '', category: 'Seed', quantity: '', unit: 'kg', low_stock_at: '' });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const latestByItem = {};
  [...blocks].reverse().forEach((b) => {
    const item = b.payload?.item;
    if (item && !latestByItem[item]) latestByItem[item] = b;
  });
  const currentStock = Object.values(latestByItem);
  const lowStockItems = currentStock.filter(
    (b) => b.payload?.low_stock_at != null && b.payload.quantity <= b.payload.low_stock_at
  );

  return (
    <div>
      <PageHeader title={t('inventoryTrackerTitle')} icon={Package} />
      <p className="text-xs text-gray-500 mb-3">
        Log seed, fertilizer, pesticide and equipment stock. Set a low-stock threshold to get warned before you run out.
      </p>

      {lowStockItems.length > 0 && (
        <Card className="mb-3 border-amber-300 bg-amber-50">
          <CardContent className="pt-3">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low
            </p>
            <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
              {lowStockItems.map((b) => (
                <li key={b.payload.item}>{b.payload.item}: {b.payload.quantity} {b.payload.unit} left (threshold {b.payload.low_stock_at})</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-3">
        <Badge variant={valid ? 'success' : 'destructive'} className="flex items-center gap-1">
          {valid ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
          {valid ? `Chain verified · ${blocks.length} entries` : 'Chain integrity check failed'}
        </Badge>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> Log stock
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label>{t('itemName')}</Label>
              <Input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="e.g. Urea 46%" />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                <Label>{t('unit')}</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('currentQuantity')}</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 12" />
              </div>
              <div>
                <Label>Low-stock warning at (optional)</Label>
                <Input type="number" value={form.low_stock_at} onChange={(e) => setForm({ ...form, low_stock_at: e.target.value })} placeholder="e.g. 5" />
              </div>
            </div>
            <Button className="w-full" onClick={submit} disabled={saving || !form.item || !form.quantity}>
              {saving ? 'Saving…' : 'Save to inventory'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading inventory…</p>
      ) : currentStock.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-gray-400">No inventory logged yet. Add your first item above.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {currentStock.map((b) => (
            <Card key={b.payload.item}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{b.payload.item}</p>
                  <p className="text-[11px] text-gray-400">{b.payload.category} · updated {new Date(b.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <p className="text-sm font-bold">{b.payload.quantity} {b.payload.unit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
