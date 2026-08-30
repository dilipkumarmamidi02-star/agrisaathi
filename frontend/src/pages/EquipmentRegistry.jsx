import { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, AlertTriangle } from 'lucide-react';
import api from '../api/apiClient';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';


export default function EquipmentRegistry() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: '', last_maintenance: '', next_maintenance: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/ledger/chain/equipment/${deviceId}');
      setBlocks(res.data.blocks || []);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

   
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await api.post('/api/ledger/log', {
        entity_type: 'equipment',
        entity_id: deviceId,
        event_type: 'equipment_registered',
        payload: form,
        actor: deviceId,
      });
      setForm({ name: '', type: '', last_maintenance: '', next_maintenance: '' });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const latestByName = {};
  [...blocks].reverse().forEach((b) => {
    const name = b.payload?.name;
    if (name && !latestByName[name]) latestByName[name] = b;
  });
  const equipment = Object.values(latestByName);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title={t('equipmentRegistryTitle')} icon={Wrench} />
      <p className="text-xs text-text-secondary mb-3">Track your machinery and its maintenance schedule.</p>

      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> Add equipment
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label>{t('equipmentName')}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mahindra 265 DI" />
            </div>
            <div>
              <Label>{t('type')}</Label>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Tractor" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('lastMaintenance')}</Label>
                <Input type="date" value={form.last_maintenance} onChange={(e) => setForm({ ...form, last_maintenance: e.target.value })} />
              </div>
              <div>
                <Label>{t('nextMaintenanceDue')}</Label>
                <Input type="date" value={form.next_maintenance} onChange={(e) => setForm({ ...form, next_maintenance: e.target.value })} />
              </div>
            </div>
            <Button className="w-full" onClick={submit} disabled={saving || !form.name}>
              {saving ? 'Saving…' : 'Save equipment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-text-muted text-center py-8">Loading equipment…</p>
      ) : equipment.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-text-muted">No equipment registered yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {equipment.map((b) => {
            const overdue = b.payload.next_maintenance && b.payload.next_maintenance < today;
            return (
              <Card key={b.payload.name} className={overdue ? 'border-amber-300 bg-amber-500/10' : ''}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{b.payload.name}</p>
                    {overdue && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  </div>
                  <p className="text-[11px] text-text-muted">{b.payload.type}</p>
                  {b.payload.next_maintenance && (
                    <p className={`text-xs mt-1 ${overdue ? 'text-amber-400 font-medium' : 'text-text-secondary'}`}>
                      Next service: {new Date(b.payload.next_maintenance).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {overdue ? ' — overdue' : ''}
                    </p>
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
