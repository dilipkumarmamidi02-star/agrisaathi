import { useState } from 'react'
import axios from 'axios';
import { Gauge, Bluetooth } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function SensorLab() {
  const { t } = useLang();
  const [tab, setTab] = useState('soil');
  const [bleStatus, setBleStatus] = useState('Not connected');

  const [soilSamples, setSoilSamples] = useState(Array(15).fill(''));
  const [n, setN] = useState(''); const [p, setP] = useState(''); const [k, setK] = useState('');
  const [oc, setOc] = useState(''); const [soilEc, setSoilEc] = useState('');
  const [soilResult, setSoilResult] = useState(null);
  const [soilError, setSoilError] = useState(null);

  const [waterSamples, setWaterSamples] = useState(Array(5).fill().map(() => ({ ph: '', ec: '' })));
  const [tds, setTds] = useState(''); const [turbidity, setTurbidity] = useState(''); const [hardness, setHardness] = useState('');
  const [waterResult, setWaterResult] = useState(null);
  const [waterError, setWaterError] = useState(null);

  const connectSensor = async () => {
    if (!navigator.bluetooth) {
      setBleStatus('Bluetooth not supported in this browser — enter readings manually below.');
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      setBleStatus(`Connected: ${device.name || 'Unknown sensor'} (reading not yet wired to a specific sensor protocol — enter values manually for now)`);
    } catch {
      setBleStatus('No device selected — enter readings manually below.');
    }
  };

  const analyzeSoil = async () => {
    setSoilError(null);
    const samples = soilSamples.filter((v) => v !== '').map(Number);
    if (samples.length === 0) { setSoilError('Enter at least one soil pH sample.'); return; }
    try {
      const res = await axios.post(`${API_URL}/api/sensors/soil/analyze`, {
        ph_samples: samples,
        n: n ? Number(n) : null,
        p: p ? Number(p) : null,
        k: k ? Number(k) : null,
        organic_carbon: oc ? Number(oc) : null,
        ec: soilEc ? Number(soilEc) : null,
      });
      setSoilResult(res.data);
    } catch (err) {setSoilError(err?.response?.data?.detail?.[0]?.msg || 'Failed to analyze soil samples.');
    }
  };

  const analyzeWater = async () => {
    setWaterError(null);
    const samples = waterSamples
      .filter((s) => s.ph !== '' || s.ec !== '')
      .map((s) => ({ ph: s.ph ? Number(s.ph) : null, ec: s.ec ? Number(s.ec) : null }));
    if (samples.length === 0) { setWaterError('Enter at least one water sample.'); return; }
    try {
      const res = await axios.post(`${API_URL}/api/sensors/water/analyze`, {
        samples,
        tds: tds ? Number(tds) : null,
        turbidity: turbidity ? Number(turbidity) : null,
        hardness: hardness ? Number(hardness) : null,
      });
      setWaterResult(res.data);
    } catch (err) {setWaterError(err?.response?.data?.detail?.[0]?.msg || 'Failed to analyze water samples.');
    }
  };

  return (
    <div>
      <PageHeader titleKey="sensorLab" icon={Gauge} />

      <Card className="mb-4"><CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{t('connectSensor')}</p>
              <p className="text-xs text-gray-400">{bleStatus}</p>
            </div>
          </div>
          <Button variant="outline" onClick={connectSensor}>{t('connect')}</Button>
        </div>
        <p className="text-[10px] text-gray-300 mt-2">
          Pairs with compatible Bluetooth soil/water sensors (Web Bluetooth). USB sensors aren't readable in-browser — connect a BLE device or enter readings manually below; all values are saved to your analysis.
        </p>
      </CardContent></Card>

      <div className="flex gap-2 mb-3">
        <button onClick={() => setTab('soil')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'soil' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Soil (15)</button>
        <button onClick={() => setTab('water')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'water' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Water (5)</button>
      </div>

      {tab === 'soil' ? (
        <>
          <p className="text-sm font-medium mb-2">Soil samples — pH (up to 15 from the same field)</p>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {soilSamples.map((v, i) => (
              <Input key={i} placeholder={`S${i + 1}`} value={v} type="number" step="0.1"
                onChange={(e) => { const arr = [...soilSamples]; arr[i] = e.target.value; setSoilSamples(arr); }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div><p className="text-xs mb-1">N (kg/ha)</p><Input type="number" value={n} onChange={(e) => setN(e.target.value)} /></div>
            <div><p className="text-xs mb-1">P (kg/ha)</p><Input type="number" value={p} onChange={(e) => setP(e.target.value)} /></div>
            <div><p className="text-xs mb-1">K (kg/ha)</p><Input type="number" value={k} onChange={(e) => setK(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div><p className="text-xs mb-1">{t('organicCarbon')}</p><Input type="number" value={oc} onChange={(e) => setOc(e.target.value)} /></div>
            <div><p className="text-xs mb-1">EC (dS/m)</p><Input type="number" value={soilEc} onChange={(e) => setSoilEc(e.target.value)} /></div>
          </div>
          <Button onClick={analyzeSoil} className="w-full bg-green-600 hover:bg-green-700 mb-4">{t('analyzeSoil')}</Button>
          {soilError && <p className="text-sm text-red-500 mb-3">{soilError}</p>}
          {soilResult && (
            <Card><CardContent className="pt-4 space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2"><div className="text-[10px] text-gray-400">{t('avgPh')}</div><div className="text-sm font-medium">{soilResult.avg_ph}</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-[10px] text-gray-400">{t('range')}</div><div className="text-sm font-medium">{soilResult.min_ph}-{soilResult.max_ph}</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-[10px] text-gray-400">{t('variation')}</div><div className="text-sm font-medium">{soilResult.variation}</div></div>
              </div>
              <Badge className="bg-blue-100 text-blue-700">{soilResult.ph_classification}</Badge>
              <p className="text-xs text-gray-500">{soilResult.variation_note}</p>
              <p className="text-xs font-medium text-gray-700 mt-2">{t('suitableCropsAtPh')}</p>
              <div className="flex flex-wrap gap-1">
                {soilResult.suitable_crops.map((c) => <Badge key={c} className="bg-green-50 text-green-700">{c}</Badge>)}
              </div>
            </CardContent></Card>
          )}
        </>
      ) : (
        <>
          <p className="text-sm font-medium mb-2">{t('waterSamplesLabel')}</p>
          {waterSamples.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 mb-2">
              <Input placeholder={`#${i + 1} pH`} type="number" step="0.1" value={s.ph}
                onChange={(e) => { const arr = [...waterSamples]; arr[i] = { ...arr[i], ph: e.target.value }; setWaterSamples(arr); }} />
              <Input placeholder="EC" type="number" step="0.1" value={s.ec}
                onChange={(e) => { const arr = [...waterSamples]; arr[i] = { ...arr[i], ec: e.target.value }; setWaterSamples(arr); }} />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 my-3">
            <div><p className="text-xs mb-1">TDS (mg/L)</p><Input type="number" value={tds} onChange={(e) => setTds(e.target.value)} /></div>
            <div><p className="text-xs mb-1">Turbidity (NTU)</p><Input type="number" value={turbidity} onChange={(e) => setTurbidity(e.target.value)} /></div>
            <div><p className="text-xs mb-1">Hardness (mg/L)</p><Input type="number" value={hardness} onChange={(e) => setHardness(e.target.value)} /></div>
          </div>
          <Button onClick={analyzeWater} className="w-full bg-blue-600 hover:bg-blue-700 mb-4">{t('checkWaterSuitability')}</Button>
          {waterError && <p className="text-sm text-red-500 mb-3">{waterError}</p>}
          {waterResult && (
            <Card><CardContent className="pt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2"><div className="text-[10px] text-gray-400">{t('avgPh')}</div><div className="text-sm font-medium">{waterResult.avg_ph ?? '—'}</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-[10px] text-gray-400">{t('avgEc')}</div><div className="text-sm font-medium">{waterResult.avg_ec ?? '—'}</div></div>
              </div>
              <ul className="text-xs text-gray-600 list-disc pl-4 mt-2">
                {waterResult.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}
