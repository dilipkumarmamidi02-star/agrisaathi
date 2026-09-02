import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Home, Syringe, Utensils, Thermometer, TrendingUp,
  AlertTriangle, IndianRupee, Droplets,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { registerReadableContent, clearReadableContent } from '@/lib/pageReadable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/PageHeader';
import animalData from '@/data/animalEncyclopedia.json';
import AnimalEncyclopediaScene3D from '@/components/AnimalEncyclopediaScene3D';
import { usePageContext } from '@/contexts/AgricultureContext';


function buildAnimalReadableText(animal, category) {
  const parts = [];
  parts.push(`${animal.name}, kept for ${animal.purpose}, in the ${category.name} category.`);

  if (animal.breeds?.length) {
    const b = animal.breeds.map((x) => `${x.name} from ${x.origin}, known for ${x.traits}`).join('. ');
    parts.push(`Breeds: ${b}.`);
  }
  if (animal.housing) {
    const h = animal.housing;
    parts.push(`Housing: ${h.type}, needs ${h.space_requirement} space, temperature range ${h.temperature_range}, humidity ${h.humidity}, ventilation ${h.ventilation}. ${h.notes || ''}`);
  }
  if (animal.feed) {
    const f = animal.feed;
    parts.push(`Feed: ${f.type}, daily quantity ${f.daily_quantity}, key ingredients ${f.key_ingredients}, water requirement ${f.water_requirement}.`);
  }
  if (animal.vaccination_schedule?.length) {
    const v = animal.vaccination_schedule.map((x) => `at ${x.age}, give ${x.vaccine} to prevent ${x.disease_prevented}, via ${x.route}`).join('. ');
    parts.push(`Vaccination schedule: ${v}.`);
  }
  if (animal.yield_timeline?.length) {
    const y = animal.yield_timeline.map((x) => `${x.stage} around ${x.age_range}: ${x.milestone}`).join('. ');
    parts.push(`Yield timeline: ${y}.`);
  }
  if (animal.common_diseases?.length) {
    parts.push(`Common diseases to watch for: ${animal.common_diseases.join(', ')}.`);
  }
  if (animal.economics) {
    const e = Object.entries(animal.economics).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ');
    parts.push(`Quick facts: ${e}.`);
  }
  return parts.join(' ');
}

export default function AnimalEncyclopediaDetail() {
  const { categoryId, typeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();

  const category = animalData.categories.find((c) => c.id === categoryId);
  const animal = category?.types.find((tItem) => tItem.id === typeId);

  const [activeStage, setActiveStage] = useState(null);

  usePageContext({
    page: 'animal-encyclopedia-detail',
    animalCategory: categoryId,
    animal: animal?.name || null,
  });

  useEffect(() => {
    if (!animal || !category) return undefined;
    registerReadableContent(animal.name, buildAnimalReadableText(animal, category));
    return () => clearReadableContent();
  }, [animal, category]);

  if (!animal) {
    return (
      <div>
        <PageHeader titleKey="animalEncyclopedia" icon={Home} />
        <p className="text-sm text-lt-text-muted text-center py-8">{t('animalTypeNotFound')}</p>
        <button onClick={() => navigate('/animal-encyclopedia')} className="text-sm text-lt-success flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-4 w-4" />{t('backToEncyclopedia')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/animal-encyclopedia')}
        className="flex items-center gap-1 text-xs text-lt-text-secondary mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" />{t('backToEncyclopedia')}
      </button>

      <div className="mb-4">
        <h1 className="text-lg font-bold text-lt-text">{animal.name}</h1>
        <p className="text-sm text-lt-text-secondary">{category.name} &middot; {animal.purpose}</p>
      </div>

      <AnimalEncyclopediaScene3D
        category={categoryId}
        maturity={
          activeStage != null
            ? (activeStage + 1) / animal.yield_timeline.length
            : 1
        }
      />

      {/* Breeds */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-lt-text mb-2">{t('breeds')}</h3>
          <div className="space-y-2">
            {animal.breeds.map((b) => (
              <div key={b.name} className="border border-lt-border rounded-lg p-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{b.name}</p>
                  <Badge className="bg-lt-bg text-lt-text-secondary text-[10px]">{b.origin}</Badge>
                </div>
                <p className="text-xs text-lt-text-secondary mt-0.5">{b.traits}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Housing / Environment */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-lt-text mb-2 flex items-center gap-1.5">
            <Thermometer className="h-4 w-4 text-blue-600" />{t('housingEnvironment')}
          </h3>
          <dl className="text-xs text-lt-text-secondary space-y-1.5">
            <div><dt className="inline font-medium text-lt-text">{t('housingType')}: </dt><dd className="inline">{animal.housing.type}</dd></div>
            <div><dt className="inline font-medium text-lt-text">{t('spaceRequirement')}: </dt><dd className="inline">{animal.housing.space_requirement}</dd></div>
            <div><dt className="inline font-medium text-lt-text">{t('temperatureRange')}: </dt><dd className="inline">{animal.housing.temperature_range}</dd></div>
            <div><dt className="inline font-medium text-lt-text">{t('humidity')}: </dt><dd className="inline">{animal.housing.humidity}</dd></div>
            <div><dt className="inline font-medium text-lt-text">{t('ventilation')}: </dt><dd className="inline">{animal.housing.ventilation}</dd></div>
            {animal.housing.notes && (
              <p className="text-[11px] text-lt-text-secondary italic mt-1">{animal.housing.notes}</p>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Feed */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-lt-text mb-2 flex items-center gap-1.5">
            <Utensils className="h-4 w-4 text-amber-600" />{t('feedRequirements')}
          </h3>
          <dl className="text-xs text-lt-text-secondary space-y-1.5">
            <div><dt className="inline font-medium text-lt-text">{t('feedType')}: </dt><dd className="inline">{animal.feed.type}</dd></div>
            <div><dt className="inline font-medium text-lt-text">{t('dailyQuantity')}: </dt><dd className="inline">{animal.feed.daily_quantity}</dd></div>
            <div><dt className="inline font-medium text-lt-text">{t('keyIngredients')}: </dt><dd className="inline">{animal.feed.key_ingredients}</dd></div>
            <div className="flex items-center gap-1"><Droplets className="h-3 w-3 text-cyan-500" /><dt className="inline font-medium text-lt-text">{t('waterRequirement')}: </dt><dd className="inline">{animal.feed.water_requirement}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {/* Vaccination Schedule */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-lt-text mb-2 flex items-center gap-1.5">
            <Syringe className="h-4 w-4 text-rose-600" />{t('vaccinationSchedule')}
          </h3>
          <div className="space-y-2">
            {animal.vaccination_schedule.map((v, i) => (
              <div key={i} className="flex gap-2 border-l-2 border-rose-200 pl-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className="bg-rose-50 text-rose-700 text-[10px]">{v.age}</Badge>
                    <span className="text-xs font-medium">{v.vaccine}</span>
                  </div>
                  <p className="text-[11px] text-lt-text-secondary">
                    {t('prevents')}: {v.disease_prevented} &middot; {t('route')}: {v.route}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Yield Timeline */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-lt-text mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-lt-primary" />{t('yieldTimeline')}
          </h3>
          <div className="relative pl-4 space-y-3">
            <div className="absolute left-1.5 top-1 bottom-1 w-px bg-lt-primary/20" />
            {animal.yield_timeline.map((y, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => setActiveStage(activeStage === i ? null : i)}
                onKeyDown={(e) => e.key === 'Enter' && setActiveStage(activeStage === i ? null : i)}
                className={`relative cursor-pointer rounded-md -ml-1 pl-1 py-0.5 transition-colors ${activeStage === i ? 'bg-lt-success/10' : ''}`}
              >
                <div className={`absolute -left-4 top-1 h-2.5 w-2.5 rounded-full ${activeStage === i ? 'bg-lt-success ring-2 ring-lt-success/30' : 'bg-lt-success/100'}`} />
                <p className="text-xs font-semibold text-lt-text">{y.stage} <span className="text-lt-text-muted font-normal">&middot; {y.age_range}</span></p>
                <p className="text-[11px] text-lt-text-secondary">{y.milestone}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-[10px] text-lt-text-muted -mt-2 mb-3 text-center">
        Tap a yield stage above to see it reflected in the 3D animal &middot; tap again for fully grown
      </p>

      {/* Common Diseases */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-lt-text mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-orange-600" />{t('commonDiseases')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {animal.common_diseases.map((d) => (
              <Badge key={d} className="bg-orange-50 text-orange-700 text-[10px]">{d}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Economics */}
      {animal.economics && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-lt-text mb-2 flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4 text-emerald-600" />{t('quickFacts')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(animal.economics).map(([k, v]) => (
                <div key={k} className="bg-lt-success/10 border border-emerald-100 rounded-lg p-2">
                  <p className="text-[10px] text-lt-text-secondary capitalize">{k.replace(/_/g, ' ')}</p>
                  <p className="text-xs font-semibold text-lt-success">{String(v)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
