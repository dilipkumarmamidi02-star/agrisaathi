import { useState, useEffect } from 'react'
import api from '../api/apiClient';
import { Bug } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';
import { useLang } from '../lib/i18n';
import PageBackdrop from '../components/PageBackdrop';
import { usePageContext } from '../contexts/AgricultureContext';

// The library's `affects` field is a free-text list like "Rice, Wheat,
// Maize" — take the first named crop as the representative one to show.
function firstAffectedCrop(affects) {
  if (!affects) return null;
  return affects.split(/[,/]/)[0].trim();
}


const TYPE_COLORS = {
  pest: 'bg-red-100 text-red-400',
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
  const [selectedPest, setSelectedPest] = useState(null);

  usePageContext({
    page: 'pest-library',
    pest: selectedPest?.name || null,
    crop: selectedPest ? firstAffectedCrop(selectedPest.affects) : null,
  });

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
    <PageBackdrop query="crop pest insect leaf field">
    <div>
      <PageHeader titleKey="pestLibrary" icon={Bug} />

      <div className="flex gap-2 mb-3">
        <button onClick={() => setTab('crop')} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${tab === 'crop' ? 'bg-lt-primary text-white border-lt-primary' : 'bg-lt-card text-lt-text-secondary border-lt-border'}`}>Crop pests & weeds</button>
        <button onClick={() => setTab('livestock')} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${tab === 'livestock' ? 'bg-lt-primary text-white border-lt-primary' : 'bg-lt-card text-lt-text-secondary border-lt-border'}`}>{t('livestockVaccines')}</button>
      </div>

      {tab === 'crop' ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {['all', 'pest', 'disease', 'weed'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${filter === f ? 'bg-lt-text text-white border-lt-text' : 'bg-lt-card text-lt-text-secondary border-lt-border'}`}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filtered.map((p, i) => (
              <Card
                key={i}
                onClick={() => setSelectedPest(selectedPest === p ? null : p)}
                className={`cursor-pointer transition-colors ${selectedPest === p ? 'border-lt-primary ring-1 ring-lt-primary/30' : ''}`}
              >
                <CardContent className="pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{p.name}</p>
                  <Badge className={TYPE_COLORS[p.type] || 'bg-lt-bg text-lt-text'}>{p.type}</Badge>
                </div>
                <p className="text-xs text-lt-text-muted mt-0.5">Affects: {p.affects}</p>
                <p className="text-xs text-lt-text-secondary mt-1"><span className="font-medium">Symptoms:</span> {p.symptoms}</p>
                <p className="text-xs text-lt-text-secondary mt-1"><span className="font-medium">Management:</span> {p.management}</p>
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
                <Badge className="bg-blue-100 text-cyan-400">{v.species}</Badge>
              </div>
              <p className="text-xs text-lt-text-secondary mt-1"><span className="font-medium">Vaccine:</span> {v.vaccine}</p>
              <p className="text-xs text-lt-text-secondary mt-1"><span className="font-medium">Schedule:</span> {v.schedule}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      {disclaimer && <p className="text-[10px] text-lt-border mt-3">{disclaimer}</p>}
      <DataGovFeaturePanel feature="Pesticide Library" />
    </div>
    </PageBackdrop>
  );
}
