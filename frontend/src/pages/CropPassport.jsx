import { useState, useEffect } from 'react'
import { ShieldCheck, Search, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function CropPassport() {
  const { t } = useLang();
  const [requirements, setRequirements] = useState([]);
  const [source, setSource] = useState('reference_data');
  const [selected, setSelected] = useState(null);
  const [chain, setChain] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/crop-passport/requirements`)
      .then((res) => {
        setRequirements(res.data.requirements);
        setSource(res.data.source);
      })
      .catch(() => setRequirements([]));
  }, []);

  const current = requirements.find((r) => r.crop === selected);

  const generatePassport = async () => {
    if (!current) return;
    setGenerating(true);
    try {
      await axios.post(`${API_URL}/api/ledger/log`, {
        entity_type: 'crop_passport',
        entity_id: current.crop,
        event_type: 'passport_generated',
        payload: current,
      });
      const chainRes = await axios.get(
        `${API_URL}/api/ledger/chain/crop_passport/${encodeURIComponent(current.crop)}`
      );
      setChain(chainRes.data);
    } catch {
      setChain(null);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <PageHeader title={t('cropPassportTitle')} icon={ShieldCheck} />
      <p className="text-xs text-gray-500 mb-3">
        Reference soil and water requirements per crop, recorded to a tamper-evident ledger.
      </p>

      {source === 'reference_data' && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          Showing reference data. Live data.gov.in crop requirement data will replace this once the API key is active.
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <select
          value={selected || ''}
          onChange={(e) => { setSelected(e.target.value); setChain(null); }}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">{t('selectACrop')}</option>
          {requirements.map((r) => (
            <option key={r.crop} value={r.crop}>{r.crop}</option>
          ))}
        </select>
      </div>

      {current && (
        <div className="space-y-2 mb-4">
          <div className="bg-white p-3 rounded-lg border grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-gray-400">Soil pH</p><p className="font-medium">{current.soil_ph}</p></div>
            <div><p className="text-gray-400">Nitrogen (kg/ha)</p><p className="font-medium">{current.nitrogen_kg_ha}</p></div>
            <div><p className="text-gray-400">Phosphorus (kg/ha)</p><p className="font-medium">{current.phosphorus_kg_ha}</p></div>
            <div><p className="text-gray-400">Potassium (kg/ha)</p><p className="font-medium">{current.potassium_kg_ha}</p></div>
            <div><p className="text-gray-400">Temperature (°C)</p><p className="font-medium">{current.temperature_c}</p></div>
            <div><p className="text-gray-400">Water need</p><p className="font-medium">{current.water_requirement}</p></div>
            <div className="col-span-2"><p className="text-gray-400">Moisture</p><p className="font-medium">{current.moisture}</p></div>
          </div>

          <button
            onClick={generatePassport}
            disabled={generating}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {generating ? 'Recording...' : 'Generate Verified Passport'}
          </button>
        </div>
      )}

      {chain && (
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            {chain.valid ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <p className="text-sm font-semibold">
              {chain.valid ? 'Ledger verified' : 'Ledger integrity check failed'}
            </p>
          </div>
          <div className="space-y-1">
            {chain.blocks.map((b) => (
              <div key={b.index} className="text-xs text-gray-500 border-b border-gray-50 pb-1">
                <span className="font-medium text-gray-700">#{b.index} {b.event_type}</span>
                {' — '}
                {new Date(b.timestamp).toLocaleString()}
                <p className="text-[10px] text-gray-400 truncate">hash: {b.hash}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
