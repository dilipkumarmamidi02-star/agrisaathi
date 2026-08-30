import { useState, useEffect } from 'react'
import { GraduationCap, Play, FileText, Clock, ExternalLink, Search } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';

const CATEGORIES = [
  { value: '', label: 'all' },
  { value: 'crop', label: 'crop' },
  { value: 'livestock', label: 'livestock' },
  { value: 'soil', label: 'soil' },
  { value: 'irrigation', label: 'irrigation' },
  { value: 'machinery', label: 'machinery' },
  { value: 'marketing', label: 'marketing' },
];

export default function TrainingCenter() {
  const { t } = useLang();
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { appClient.entities.TrainingResource.list('title', 200).then(setResources).catch(() => {}); }, []);

  let list = resources
    .filter((r) => !filter || r.category === filter)
    .filter((r) => !search || (r.title + ' ' + (r.summary || '')).toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader titleKey="trainingCenter" icon={GraduationCap} />
      <p className="text-xs text-gray-500 mb-3">{t('trainingIntro')}</p>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="pl-9" />
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setFilter(c.value)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === c.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t(c.label)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-gray-400">{t('noResources')}</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {list.map((r) => {
            const Icon = r.type === 'video' ? Play : FileText;
            return (
              <Card key={r.id}><CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${r.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm leading-tight">{r.title}</h3>
                    {r.summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.summary}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge variant="secondary">{t(r.category)}</Badge>
                      {r.difficulty && <Badge className={r.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : r.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>{t(r.difficulty)}</Badge>}
                      {r.duration_minutes != null && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Clock className="h-3 w-3" />{r.duration_minutes}m</span>}
                      {r.language && r.language !== 'en' && <Badge variant="outline">{r.language}</Badge>}
                    </div>
                  </div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
      <DataGovFeaturePanel feature="Training" />
    </div>
  );
}
