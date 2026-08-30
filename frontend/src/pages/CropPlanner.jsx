import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  FlaskConical
} from 'lucide-react';
import {
  useLang
} from '../lib/i18n';
import {
  base44
} from '../api/base44Client';
import api from '../api/apiClient';
import { useLocationContext } from '../lib/LocationContext';
import {
  Card,
  CardContent
} from '../components/ui/card';
import {
  Badge
} from '../components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../components/ui/select';
import {
  Label
} from '../components/ui/label';
import {
  Button
} from '../components/ui/button';
import PageHeader from '../components/PageHeader';
import YieldEstimator from '../components/YieldEstimator';

const waterScore = (need, avail) => {
  if (!need) return 1;
  const n = need.toLowerCase();
  if (n.includes('very low')) return avail === 'low' ? 3 : avail === 'medium' ? 2 : 1;
  if (n.includes('low')) return avail === 'low' ? 3 : avail === 'medium' ? 2.5 : 1.5;
  if (n.includes('high')) return avail === 'high' ? 3 : avail === 'medium' ? 2 : 1;
  return avail === 'medium' ? 2.5 : 2;
};

export default function CropPlanner() {
  const { t } = useLang();
  const [crops, setCrops] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [water, setWater] = useState('medium');
  const [season, setSeason] = useState('');
  const [ranked, setRanked] = useState([]);
  const [estimates, setEstimates] = useState({});
  const [loading, setLoading] = useState(false);
  const [soilCtx, setSoilCtx] = useState(null);
  const [waterCtx, setWaterCtx] = useState(null);
  const [districtOptions, setDistrictOptions] = useState([]);
  const { browseDistricts } = useLocationContext();

  useEffect(() => {
    base44.entities.Crop.list('name_en', 300).then(setCrops).catch(() => []);
    base44.entities.StateSoilProfile.list().then(setProfiles).catch(() => []);
  }, []);

  useEffect(() => {
    if (!state) { setDistrictOptions([]); return; }
    browseDistricts(state).then(setDistrictOptions);
  }, [state, browseDistricts]);

  const plan = async () => {
    const profile = profiles.find((p) => p.state_ut === state);
    let soil = null, wq = null;
    try {
      const soilRecs = await base44.entities.SoilRecord.list('-test_date', 50);
      soil = soilRecs.find((r) => (!state || r.state === state) && (!district || r.district === district)) || soilRecs.find((r) => !state || r.state === state) || soilRecs[0];
    } catch (err) {console.warn("CropPlanner data fetch failed:", err);
    }
    try {
      const wqRecs = await base44.entities.SensorTest.filter({ test_type: 'water' }, '-test_date', 20).catch(() => []);
      wq = wqRecs[0];
    } catch (err) {console.warn("CropPlanner data fetch failed:", err);
    }
    setSoilCtx(soil); setWaterCtx(wq);
    const soilInfo = soil ? `Soil pH ${soil.ph ?? '?'}, N ${soil.nitrogen ?? '?'}, P ${soil.phosphorus ?? '?'}, K ${soil.potassium ?? '?'}, OC ${soil.organic_carbon ?? '?'}%, type ${soil.soil_type || '?'}` : 'unknown';
    const waterInfo = wq ? `Water pH ${wq.water_ph ?? '?'}, EC ${wq.water_ec ?? '?'}, TDS ${wq.water_tds ?? '?'}` : 'no water test data';
    const scored = crops.map((c) => {
      let score = 0;
      if (state && c.typical_states?.toLowerCase().includes(state.toLowerCase().split(' ')[0])) score += 3;
      score += waterScore(c.water_requirement, water);
      if (season && c.season?.toLowerCase().includes(season.toLowerCase())) score += 2;
      if (profile && c.typical_states?.toLowerCase().includes(state.toLowerCase().split(' ')[0])) score += 0.5;
      return { ...c, _score: score };
    }).sort((a, b) => b._score - a._score).slice(0, 8);
    setRanked(scored);
    setLoading(true);
    setEstimates({});
    try {
      const res = await api.post('/api/crop-planner/estimate', {
        state, district, water, season,
        soil_context: soilInfo,
        water_context: waterInfo,
        crop_names: scored.map((c) => c.name_en),
      });
      const map = {};
      (res.data.crops || []).forEach((c) => { map[c.name] = c; });
      setEstimates(map);
      api.post('/api/ledger/log', {
        entity_type: 'crop_plan',
        entity_id: `${state || 'india'}_${Date.now()}`,
        event_type: 'plan_generated',
        payload: { state, district, water, season, top_crops: scored.slice(0, 3).map((c) => c.name_en) },
      }).catch(() => {});
    } catch {
      setEstimates({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader titleKey="cropPlanner" icon={TrendingUp} />
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">⚠️ {t('estimate')}</p>

      <div className="mb-4">
        <YieldEstimator />
      </div>

      <div className="space-y-3 mb-4">
        <div><Label className="mb-1.5 block">{t('state')}</Label>
          <Select value={state} onValueChange={(v) => { setState(v); setDistrict(''); }}>
            <SelectTrigger><SelectValue placeholder={t('state')} /></SelectTrigger>
            <SelectContent className="max-h-72">{profiles.map((p) => <SelectItem key={p.id} value={p.state_ut}>{p.state_ut}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1.5 block">{t('district')}</Label>
          <Select value={district} onValueChange={setDistrict} disabled={!state}>
            <SelectTrigger><SelectValue placeholder={state ? t('selectDistrict') : t('selectStateFirst')} /></SelectTrigger>
            <SelectContent className="max-h-72">{districtOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1.5 block">{t('water')}</Label>
          <Select value={water} onValueChange={setWater}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="low">{t('low')}</SelectItem><SelectItem value="medium">{t('medium')}</SelectItem><SelectItem value="high">{t('high')}</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1.5 block">{t('season')}</Label>
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger><SelectValue placeholder={t('any')} /></SelectTrigger>
            <SelectContent><SelectItem value="kharif">{t('kharif')}</SelectItem><SelectItem value="rabi">{t('rabi')}</SelectItem><SelectItem value="zaid">{t('zaid')}</SelectItem><SelectItem value="perennial">{t('perennial')}</SelectItem></SelectContent>
          </Select>
        </div>
        <Button onClick={plan} className="w-full bg-green-600 hover:bg-green-700 h-12">{t('rankByFit')}</Button>
      </div>

      {(soilCtx || waterCtx) && (
        <Card className="mb-4 bg-green-50 border-green-100"><CardContent className="pt-3 text-xs">
          <p className="font-semibold text-green-700 flex items-center gap-1 mb-1"><FlaskConical className="h-3 w-3" />{t('soilWaterContext')}</p>
          {soilCtx && <p className="text-gray-600">pH {soilCtx.ph ?? '—'} · N {soilCtx.nitrogen ?? '—'} · P {soilCtx.phosphorus ?? '—'} · K {soilCtx.potassium ?? '—'}</p>}
          {waterCtx && <p className="text-gray-600">Water pH {waterCtx.water_ph ?? '—'} · EC {waterCtx.water_ec ?? '—'}</p>}
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {ranked.map((c, i) => {
          const est = estimates[c.name_en];
          return (
            <Card key={c.id}><CardContent className="pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{c.name_en}</p>
                    <p className="text-xs text-gray-400">{c.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-50 text-blue-700">{c.water_requirement}</Badge>
                  <p className="text-[10px] text-gray-400 mt-0.5">{c.season} · {c.duration_days}</p>
                </div>
              </div>
              {loading && <p className="text-xs text-gray-400 mt-1">{t('loading')}</p>}
              {est && (
                <div className="grid grid-cols-3 gap-1 mt-2 text-center text-xs">
                  <div className="bg-red-50 rounded p-1"><div className="text-gray-400">{t('cost')}</div><div className="font-medium">{est.cost}</div></div>
                  <div className="bg-green-50 rounded p-1"><div className="text-gray-400">{t('revenue')}</div><div className="font-medium">{est.revenue}</div></div>
                  <div className="bg-amber-50 rounded p-1"><div className="text-gray-400">{t('margin')}</div><div className="font-medium">{est.margin}</div></div>
                </div>
              )}
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
