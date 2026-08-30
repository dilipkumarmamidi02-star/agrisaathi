import { ai } from '../api/appClient';
import { useState, useEffect } from 'react'
import { FlaskConical, Leaf, Shield, Search } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';

export default function Treatments() {
  const { t } = useLang();
  const [crops, setCrops] = useState([]);
  const [crop, setCrop] = useState('');
  const [issue, setIssue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { appClient.entities.Crop.list('name_en', 200).then(setCrops).catch(() => {}); }, []);

  const search = async () => {
    if (!crop || !issue) { alert('Select crop and enter issue'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await ai.invoke({
        prompt: `You are an AI agricultural treatment advisor for Indian farmers. Crop: ${crop}. Issue: ${issue}. Provide organic treatment (try first), chemical treatment with active ingredient, application method, timing, safety precautions, and pre-harvest interval if known. Cite general authoritative sources (ICAR/KVK). Never recommend banned substances or invent dosages. Simple language.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            organic_treatment: { type: 'string' },
            chemical_treatment: { type: 'string' },
            application_method: { type: 'string' },
            timing: { type: 'string' },
            precautions: { type: 'string' },
            pre_harvest_interval: { type: 'string' },
            source: { type: 'string' },
          },
          required: ['summary'],
        },
      });
      setResult(res);
    } catch { alert('Search failed'); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader titleKey="treatments" icon={FlaskConical} />
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">⚠️ {t('aiAssisted')}</p>

      <div className="space-y-3 mb-4">
        <div><Label className="mb-1.5 block">{t('selectCrop')}</Label>
          <Select value={crop} onValueChange={setCrop}>
            <SelectTrigger><SelectValue placeholder={t('selectCrop')} /></SelectTrigger>
            <SelectContent className="max-h-72">{crops.map((c) => <SelectItem key={c.id} value={c.name_en}>{c.name_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1.5 block">{t('diseasePestIssueLabel')}</Label>
          <Input value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="e.g. powdery mildew, aphids, yellow leaves" />
        </div>
        <Button onClick={search} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-12"><Search className="h-4 w-4 mr-1" />{loading ? t('analyzing') : t('search')}</Button>
      </div>

      {result && (
        <Card className="border-green-200"><CardContent className="pt-4 space-y-3">
          <h3 className="font-bold">{result.summary}</h3>
          {result.organic_treatment && <div className="bg-green-50 rounded-lg p-2.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Leaf className="h-3 w-3" />{t('organicFirst')}</p><p className="text-sm mt-0.5">{result.organic_treatment}</p></div>}
          {result.chemical_treatment && <div className="bg-blue-50 rounded-lg p-2.5"><p className="text-xs font-semibold text-blue-700">{t('chemical')}</p><p className="text-sm mt-0.5">{result.chemical_treatment}</p></div>}
          {result.application_method && <div><p className="text-xs font-semibold text-gray-500">{t('method')}</p><p className="text-sm">{result.application_method}</p></div>}
          {result.timing && <div><p className="text-xs font-semibold text-gray-500">{t('timing')}</p><p className="text-sm">{result.timing}</p></div>}
          {result.precautions && <div className="bg-amber-50 rounded-lg p-2.5"><p className="text-xs font-semibold text-amber-700 flex items-center gap-1"><Shield className="h-3 w-3" />{t('precautions')}</p><p className="text-sm mt-0.5">{result.precautions}</p></div>}
          {result.pre_harvest_interval && <p className="text-xs text-gray-500">{t('preHarvestInterval')}: {result.pre_harvest_interval}</p>}
          {result.source && <p className="text-[10px] text-gray-400">{t('source')}: {result.source}</p>}
        </CardContent></Card>
      )}
    </div>
  );
}
