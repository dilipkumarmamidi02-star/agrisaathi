import { useState, useEffect, useCallback } from 'react';
import { Leaf, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { getDeviceId } from '../lib/deviceId';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const PRACTICES = [
  { key: 'organic_fertilizer', label: 'I use organic/farmyard manure alongside or instead of chemical fertilizer' },
  { key: 'crop_rotation', label: 'I rotate crops across seasons rather than growing the same crop repeatedly' },
  { key: 'drip_irrigation', label: 'I use drip or sprinkler irrigation rather than flood irrigation' },
  { key: 'soil_testing', label: 'I test my soil before deciding on fertilizer dosage' },
  { key: 'pest_ipm', label: 'I use integrated pest management (traps, biological control) before chemical pesticides' },
  { key: 'residue_reuse', label: 'I reuse or compost crop residue rather than burning it' },
  { key: 'water_harvesting', label: 'I harvest or conserve rainwater on my farm' },
  { key: 'native_seeds', label: 'I use native or locally-adapted seed varieties where possible' },
];

export default function SustainabilityScore() {
  const { t } = useLang();
  const deviceId = getDeviceId();
  const [checked, setChecked] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/ledger/chain/sustainability/${deviceId}`);
      const blocks = res.data.blocks || [];
      if (blocks.length > 0) {
        setChecked(blocks[blocks.length - 1].payload?.practices || {});
        setSaved(true);
      }
    } catch {
      setChecked({});
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

   
  useEffect(() => { load(); }, [load]);

  const toggle = (key) => {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
    setSaved(false);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/ledger/log`, {
        entity_type: 'sustainability',
        entity_id: deviceId,
        event_type: 'checklist_updated',
        payload: { practices: checked },
        actor: deviceId,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const score = Math.round((Object.values(checked).filter(Boolean).length / PRACTICES.length) * 100);

  return (
    <div>
      <PageHeader title={t('sustainabilityScoreTitle')} icon={Leaf} />
      <p className="text-xs text-gray-500 mb-3">
        A simple self-assessment based on practices you actually follow — not an automated guess.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
      ) : (
        <>
          <Card className="mb-4">
            <CardContent className="pt-4 text-center">
              <p className="text-4xl font-bold text-green-700">{score}<span className="text-lg text-gray-400">/100</span></p>
              <p className="text-xs text-gray-500 mt-1">{Object.values(checked).filter(Boolean).length} of {PRACTICES.length} practices checked</p>
            </CardContent>
          </Card>

          <div className="space-y-2 mb-4">
            {PRACTICES.map((p) => (
              <Card key={p.key} onClick={() => toggle(p.key)} className="cursor-pointer">
                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 shrink-0 ${checked[p.key] ? 'text-green-600' : 'text-gray-200'}`} />
                  <p className="text-sm">{p.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button className="w-full" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save my checklist'}
          </Button>
        </>
      )}
    </div>
  );
}
