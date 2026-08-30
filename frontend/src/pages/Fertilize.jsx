import { useState, useEffect } from 'react'
import axios from 'axios';
import { Droplets, Leaf } from 'lucide-react';
import { useLang } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function Fertilize() {
  const { t } = useLang();
  const [crops, setCrops] = useState([]);
  const [soilProfiles, setSoilProfiles] = useState([]);
  const [form, setForm] = useState({ crop: '', area: '', unit: 'acre', state: '', n: '', p: '', k: '', ph: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/crops`).then((res) => setCrops(res.data)).catch(() => setCrops([]));
    axios.get(`${API_URL}/api/soil-profiles`).then((res) => setSoilProfiles(res.data)).catch(() => setSoilProfiles([]));
  }, []);

  const stateDefault = soilProfiles.find((s) => s.state === form.state);

  const calc = async () => {
    if (!form.crop || !form.area) {
      alert('Select crop and land size');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/fertilizer/calculate`, {
        crop: form.crop,
        area: parseFloat(form.area),
        unit: form.unit,
        soil_n: form.n ? parseFloat(form.n) : null,
        soil_p: form.p ? parseFloat(form.p) : null,
        soil_k: form.k ? parseFloat(form.k) : null,
        soil_ph: form.ph ? parseFloat(form.ph) : null,
      });
      setResult(res.data);
      axios.post(`${API_URL}/api/ledger/log`, {
        entity_type: 'fertilizer_recommendation',
        entity_id: `${form.crop}_${Date.now()}`,
        event_type: 'recommendation_generated',
        payload: { crop: form.crop, area: form.area, unit: form.unit },
      }).catch(() => {});
    } catch (_err) {
      alert('Calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader titleKey="fertilize" icon={Droplets} />
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">Estimate based on general crop reference data. Confirm with a soil test where possible.</p>

      <div className="space-y-4">
        <div>
          <Label className="mb-1.5 block">{t('selectCrop')}</Label>
          <Select value={form.crop} onValueChange={(v) => setForm({ ...form, crop: v })}>
            <SelectTrigger><SelectValue placeholder={t('selectCrop')} /></SelectTrigger>
            <SelectContent className="max-h-72">{crops.map((c) => <SelectItem key={c.name_en} value={c.name_en}>{c.name_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1.5 block">{t('area')}</Label>
            <Input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">{t('unit')}</Label>
            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="acre">{t('acre')}</SelectItem>
                <SelectItem value="hectare">{t('hectare')}</SelectItem>
                <SelectItem value="guntha">{t('guntha')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">{t('state')}</Label>
          <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
            <SelectTrigger><SelectValue placeholder={t('state')} /></SelectTrigger>
            <SelectContent className="max-h-72">{soilProfiles.map((s) => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}</SelectContent>
          </Select>
          {stateDefault && <p className="text-xs text-gray-400 mt-1">Default soil: {stateDefault.dominant_soil_type} (pH {stateDefault.typical_ph_range})</p>}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[['n', 'N'], ['p', 'P'], ['k', 'K'], ['ph', 'pH']].map(([k, lbl]) => (
            <div key={k}>
              <Label className="mb-1 block text-xs">{lbl}</Label>
              <Input type="number" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder="—" />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">{t('soilTestOptionalNote')}</p>
        <Button onClick={calc} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-12">{loading ? t('analyzing') : t('analyze')}</Button>
      </div>

      {result && (
        <Card className="mt-5 border-green-200">
          <CardContent className="pt-4 space-y-3">
            <h3 className="font-bold text-gray-900">{result.summary}</h3>
            {result.dosage && <div><p className="text-xs font-semibold text-gray-500">{t('dosage')}</p><p className="text-sm">{result.dosage}</p></div>}
            {result.method && <div><p className="text-xs font-semibold text-gray-500">{t('method')}</p><p className="text-sm">{result.method}</p></div>}
            {result.timing && <div><p className="text-xs font-semibold text-gray-500">{t('timing')}</p><p className="text-sm">{result.timing}</p></div>}
            {result.organic_option && <div className="bg-green-50 rounded-lg p-2.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Leaf className="h-3 w-3" />{t('organic')}</p><p className="text-sm mt-0.5">{result.organic_option}</p></div>}
            {result.precautions && <div className="bg-amber-50 rounded-lg p-2.5"><p className="text-xs font-semibold text-amber-700">{t('precautions')}</p><p className="text-sm mt-0.5">{result.precautions}</p></div>}
            {result.assumptions && <div><p className="text-xs font-semibold text-gray-400">{t('assumptions')}</p><p className="text-xs text-gray-500">{result.assumptions}</p></div>}
          </CardContent>
        </Card>
      )}
      <DataGovFeaturePanel feature="Fertilizer" />
    </div>
  );
}
