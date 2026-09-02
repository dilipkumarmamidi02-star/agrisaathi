import { useState, useEffect } from 'react'
import { BookOpen, Syringe, Wheat, Thermometer, TrendingUp, Loader2 } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';
import AnimalCategoryPreviewScene3D from '../components/AnimalCategoryPreviewScene3D';
import { usePageContext } from '../contexts/AgricultureContext';

export default function AnimalEncyclopedia() {
  const { t } = useLang();
  const [categories, setCategories] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  usePageContext({ page: 'animal-encyclopedia', animalCategory: expandedId });

  useEffect(() => {
    setLoading(true);
    appClient
      .call('/api/animal-encyclopedia')
      .then((res) => {
        setCategories(res.categories || []);
        setError(null);
      })
      .catch(() => setError(t('encyclopediaLoadFailed') || 'Could not load the encyclopedia. Service may be unavailable.'))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-lt-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader titleKey="animalEncyclopedia" icon={BookOpen} />
        <Card><CardContent className="pt-6 text-center text-sm text-red-500">{error}</CardContent></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titleKey="animalEncyclopedia" icon={BookOpen} />
      <p className="text-xs text-lt-text-secondary mb-3">
        Standard husbandry reference — vaccination schedules, feed and environment needs. Always confirm specifics with your local Veterinarian or KVK.
      </p>

      {categories.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-lt-text-muted">No categories available yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const expanded = expandedId === cat.category;
            return (
              <Card key={cat.category}>
                <CardContent className="pt-4">
                  <button className="w-full text-left" onClick={() => setExpandedId(expanded ? null : cat.category)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{cat.label}</h3>
                        <p className="text-xs text-lt-text-secondary">{cat.breeds?.length || 0} breeds</p>
                      </div>
                      <Badge className="bg-lt-bg text-lt-text-secondary shrink-0">{expanded ? '−' : '+'}</Badge>
                    </div>
                  </button>

                  {expanded && (
                    <div className="mt-3 space-y-3 text-xs text-lt-text">
                      <AnimalCategoryPreviewScene3D category={cat.category} label={cat.label} />

                      {cat.breeds?.length > 0 && (
                        <div>
                          <span className="font-medium">Breeds: </span>
                          <span className="text-lt-text-secondary">{cat.breeds.join(', ')}</span>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-lt-primary shrink-0 mt-0.5" />
                        <div><span className="font-medium">Yield timeline: </span>{cat.yield_timeline}</div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Wheat className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div><span className="font-medium">Feed: </span>{cat.feed}</div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Thermometer className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div><span className="font-medium">Environment: </span>{cat.environment}</div>
                      </div>

                      {cat.vaccination_schedule?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Syringe className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium">Vaccination schedule:</span>
                            <ul className="mt-1 space-y-0.5">
                              {cat.vaccination_schedule.map((v, i) => (
                                <li key={i} className="text-lt-text-secondary">• {v.age} — {v.vaccine} ({v.route})</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <DataGovFeaturePanel feature="Animal Encyclopedia" />
    </div>
  );
}
