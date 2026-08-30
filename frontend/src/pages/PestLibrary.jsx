import { useState, useEffect } from 'react'
import api from '../api/apiClient';
import { Bug } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';
import { useLang } from '../lib/i18n';


const TYPE_COLORS = {
  pest: 'bg-red-100 text-red-700',
  disease: 'bg-orange-100 text-orange-700',
  weed: 'bg-yellow-100 text-yellow-800',
};

export default function PestLibrary() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [tab, setTab] = useState('crop');
  const [filter, setFilter] = useState('all');
  const [disclaimer, setDisclaimer] = useState('');

  useEffect(() => {
    api.get('/api/pest-library')
      .then((res) => { setItems(res.data.items || []); setDisclaimer(res.data.disclaimer || ''); })
      .catch(() => setItems([]));
    api.get('/api/pest-library/livestock-vaccines')
      .then((res) => setVaccines(res.data.items || []))
      .catch(() => setVaccines([]));
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  return (
    <div>
      <PageHeader titleKey="pestLibrary" icon={Bug} />

      <div className="flex gap-2 mb-3">
        <button onClick={() => setTab('crop')} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${tab === 'crop' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>Crop pests & weeds</button>
        <button onClick={() => setTab('livestock')} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${tab === 'livestock' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>{t('livestockVaccines')}</button>
      </div>

      {tab === 'crop' ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {['all', 'pest', 'disease', 'weed'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${filter === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filtered.map((p, i) => (
              <Card key={i}><CardContent className="pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{p.name}</p>
                  <Badge className={TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-700'}>{p.type}</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Affects: {p.affects}</p>
                <p className="text-xs text-gray-600 mt-1"><span className="font-medium">Symptoms:</span> {p.symptoms}</p>
                <p className="text-xs text-gray-600 mt-1"><span className="font-medium">Management:</span> {p.management}</p>
              </CardContent></Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {vaccines.map((v, i) => (
            <Card key={i}><CardContent className="pt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{v.disease}</p>
                <Badge className="bg-blue-100 text-blue-700">{v.species}</Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1"><span className="font-medium">Vaccine:</span> {v.vaccine}</p>
              <p className="text-xs text-gray-600 mt-1"><span className="font-medium">Schedule:</span> {v.schedule}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      {disclaimer && <p className="text-[10px] text-gray-300 mt-3">{disclaimer}</p>}
      <DataGovFeaturePanel feature="Pesticide Library" />
    </div>
  );
}
