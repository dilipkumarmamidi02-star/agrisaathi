import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom';
import { Search, Sprout, ChevronRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/PageHeader';
import cropData from '@/data/cropEncyclopedia.json';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';

const CATEGORY_COLORS = {
  amber: 'bg-amber-500/10 border-amber-100 text-amber-400',
  blue: 'bg-cyan-500/10 border-blue-100 text-cyan-400',
  orange: 'bg-orange-50 border-orange-100 text-orange-700',
  green: 'bg-mint/10 border-green-100 text-mint',
  yellow: 'bg-amber-500/10 border-yellow-100 text-amber-400',
  pink: 'bg-pink-50 border-pink-100 text-pink-700',
  violet: 'bg-violet-50 border-violet-100 text-violet-700',
};

export default function Crops() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = cropData.categories;

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => activeCategory === 'all' || c.id === activeCategory)
      .map((c) => ({
        ...c,
        types: c.types.filter((tItem) =>
          !q ||
          tItem.name.toLowerCase().includes(q) ||
          tItem.category_use.toLowerCase().includes(q) ||
          tItem.varieties.some((v) => v.name.toLowerCase().includes(q))
        ),
      }))
      .filter((c) => c.types.length > 0);
  }, [categories, query, activeCategory]);

  return (
    <div>
      <PageHeader titleKey="cropEncyclopedia" icon={Sprout} />
      <p className="text-xs text-text-secondary mb-3">
        {t('cropEncyclopediaIntro')}
      </p>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchCropType')}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
            activeCategory === 'all'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-surface text-text-secondary border-border'
          }`}
        >
          {t('allCategories')}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
              activeCategory === c.id
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-surface text-text-secondary border-border'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">{t('noCropTypesFound')}</p>
      )}

      {filteredCategories.map((c) => (
        <div key={c.id} className="mb-5">
          <h3 className="text-sm font-semibold text-text-primary mb-2">{c.name}</h3>
          <div className="grid grid-cols-1 gap-2">
            {c.types.map((tItem) => (
              <Card
                key={tItem.id}
                className={`cursor-pointer hover:shadow-md transition ${CATEGORY_COLORS[c.color] || ''}`}
                onClick={() => navigate(`/crop-encyclopedia/${c.id}/${tItem.id}`)}
              >
                <CardContent className="pt-3 pb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{tItem.name}</p>
                    <p className="text-xs text-text-secondary truncate">{tItem.category_use}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tItem.varieties.slice(0, 2).map((v) => (
                        <Badge key={v.name} className="bg-surface/70 text-text-secondary border border-border text-[10px]">
                          {v.name}
                        </Badge>
                      ))}
                      {tItem.varieties.length > 2 && (
                        <Badge className="bg-surface/70 text-text-secondary border border-border text-[10px]">
                          +{tItem.varieties.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      <DataGovFeaturePanel feature="Crops" />
    </div>
  );
}
