import { useState, useEffect } from 'react'
import { BookOpen, Syringe, Wheat, Thermometer, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';

const CATEGORY_LABELS = {
  poultry: 'Poultry (Layer/Broiler)',
  dairy: 'Dairy Cattle/Buffalo',
  fisheries: 'Freshwater Fisheries',
  apiculture: 'Apiculture (Beekeeping)',
  aquaculture_prawns: 'Prawn/Shrimp Farming',
  small_ruminants: 'Goat/Sheep Herd',
};

export default function AnimalEncyclopedia() {
  const { t } = useLang();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [entries, setEntries] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    appClient
      .call('/api/livestock/encyclopedia/categories')
      .then((res) => {
        setCategories(res.categories || []);
        if (res.categories?.length) setActiveCategory(res.categories[0]);
        setError(null);
      })
      .catch(() => setError(t('encyclopediaLoadFailed') || 'Could not load the encyclopedia. Service may be unavailable.'))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (!activeCategory) return;
    setLoadingEntries(true);
    appClient
      .call(`/api/livestock/encyclopedia/${activeCategory}`)
      .then((res) => setEntries(Array.isArray(res) ? res : []))
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false));
  }, [activeCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
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
      <p className="text-xs text-gray-500 mb-3">
        Standard husbandry reference — vaccination schedules, feed and environment needs. Always confirm specifics with your local Veterinarian or KVK.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
              activeCategory === c ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {CATEGORY_LABELS[c] || c}
          </button>
        ))}
      </div>

      {loadingEntries ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
        </div>
      ) : entries.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-gray-400">No entries for this category yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <Card key={entry.id}>
                <CardContent className="pt-4">
                  <button className="w-full text-left" onClick={() => setExpandedId(expanded ? null : entry.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{entry.name_en}</h3>
                        <p className="text-xs text-gray-500">{entry.purpose}</p>
                      </div>
                      <Badge className="bg-gray-100 text-gray-600 shrink-0">{expanded ? '−' : '+'}</Badge>
                    </div>
                  </button>

                  {expanded && (
                    <div className="mt-3 space-y-3 text-xs text-gray-700">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                        <div><span className="font-medium">Maturity & yield: </span>{entry.maturity_yield}</div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Wheat className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div><span className="font-medium">Feed: </span>{entry.feed}</div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Thermometer className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div><span className="font-medium">Environment: </span>{entry.environment}</div>
                      </div>

                      {entry.vaccination_schedule?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Syringe className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium">Vaccination schedule:</span>
                            <ul className="mt-1 space-y-0.5">
                              {entry.vaccination_schedule.map((v, i) => (
                                <li key={i} className="text-gray-600">• {v.age} — {v.vaccine}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {entry.care_notes && (
                        <div className="bg-blue-50 rounded-lg p-2 text-blue-700">{entry.care_notes}</div>
                      )}

                      {entry.common_risks?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">Common risks: </span>
                            {entry.common_risks.join(', ')}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">{entry.source}</p>
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

