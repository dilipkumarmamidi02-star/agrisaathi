import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Home, FlaskConical, Droplets, Sun, TrendingUp,
  AlertTriangle, IndianRupee,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { registerReadableContent, clearReadableContent } from '@/lib/pageReadable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/PageHeader';
import cropData from '@/data/cropEncyclopedia.json';


function buildCropReadableText(crop, category) {
  const parts = [];
  parts.push(`${crop.name}, a ${crop.category_use} crop in the ${category.name} category.`);

  if (crop.varieties?.length) {
    const v = crop.varieties.map((x) => `${x.name} from ${x.origin}, known for ${x.traits}`).join('. ');
    parts.push(`Varieties: ${v}.`);
  }
  if (crop.climate_soil) {
    const c = crop.climate_soil;
    parts.push(`Climate and soil: needs ${c.soil_type} soil, ${c.climate} climate, ${c.rainfall} rainfall, and a temperature range of ${c.temperature_range}. ${c.notes || ''}`);
  }
  if (crop.sowing_irrigation) {
    const s = crop.sowing_irrigation;
    parts.push(`Sowing and irrigation: sow during ${s.sowing_time}, seed rate ${s.seed_rate}, spacing ${s.spacing}. Irrigation schedule: ${s.irrigation_schedule}, water requirement ${s.water_requirement}.`);
  }
  if (crop.fertilizer_schedule?.length) {
    const f = crop.fertilizer_schedule.map((x) => `at ${x.stage} stage, apply ${x.fertilizer}, dose ${x.dose}`).join('. ');
    parts.push(`Fertilizer schedule: ${f}.`);
  }
  if (crop.growth_timeline?.length) {
    const g = crop.growth_timeline.map((x) => `${x.stage} around ${x.age_range}: ${x.milestone}`).join('. ');
    parts.push(`Growth timeline: ${g}.`);
  }
  if (crop.common_pests_diseases?.length) {
    parts.push(`Common pests and diseases to watch for: ${crop.common_pests_diseases.join(', ')}.`);
  }
  if (crop.economics) {
    const e = Object.entries(crop.economics).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ');
    parts.push(`Quick facts: ${e}.`);
  }
  return parts.join(' ');
}

export default function CropEncyclopediaDetail() {
  const { categoryId, typeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();

  const category = cropData.categories.find((c) => c.id === categoryId);
  const crop = category?.types.find((tItem) => tItem.id === typeId);

  useEffect(() => {
    if (!crop || !category) return undefined;
    registerReadableContent(crop.name, buildCropReadableText(crop, category));
    return () => clearReadableContent();
  }, [crop, category]);

  if (!crop) {
    return (
      <div>
        <PageHeader titleKey="cropEncyclopedia" icon={Home} />
        <p className="text-sm text-text-muted text-center py-8">{t('cropTypeNotFound')}</p>
        <button onClick={() => navigate('/crops')} className="text-sm text-mint flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-4 w-4" />{t('backToEncyclopedia')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/crops')}
        className="flex items-center gap-1 text-xs text-text-secondary mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" />{t('backToEncyclopedia')}
      </button>

      <div className="mb-4">
        <h1 className="text-lg font-bold text-text-primary">{crop.name}</h1>
        <p className="text-sm text-text-secondary">{category.name} &middot; {crop.category_use}</p>
      </div>

      {/* Varieties */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">{t('varieties')}</h3>
          <div className="space-y-2">
            {crop.varieties.map((v) => (
              <div key={v.name} className="border border-border rounded-lg p-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{v.name}</p>
                  <Badge className="bg-surface-hover text-text-secondary text-[10px]">{v.origin}</Badge>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{v.traits}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Climate & Soil */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <Sun className="h-4 w-4 text-amber-600" />{t('climateSoil')}
          </h3>
          <dl className="text-xs text-text-secondary space-y-1.5">
            <div><dt className="inline font-medium text-text-primary">{t('soilType')}: </dt><dd className="inline">{crop.climate_soil.soil_type}</dd></div>
            <div><dt className="inline font-medium text-text-primary">{t('climate')}: </dt><dd className="inline">{crop.climate_soil.climate}</dd></div>
            <div><dt className="inline font-medium text-text-primary">{t('rainfall')}: </dt><dd className="inline">{crop.climate_soil.rainfall}</dd></div>
            <div><dt className="inline font-medium text-text-primary">{t('temperatureRange')}: </dt><dd className="inline">{crop.climate_soil.temperature_range}</dd></div>
            {crop.climate_soil.notes && (
              <p className="text-[11px] text-text-secondary italic mt-1">{crop.climate_soil.notes}</p>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Sowing & Irrigation */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <Droplets className="h-4 w-4 text-cyan-600" />{t('sowingIrrigation')}
          </h3>
          <dl className="text-xs text-text-secondary space-y-1.5">
            <div><dt className="inline font-medium text-text-primary">{t('sowingTime')}: </dt><dd className="inline">{crop.sowing_irrigation.sowing_time}</dd></div>
            <div><dt className="inline font-medium text-text-primary">{t('seedRate')}: </dt><dd className="inline">{crop.sowing_irrigation.seed_rate}</dd></div>
            <div><dt className="inline font-medium text-text-primary">{t('spacing')}: </dt><dd className="inline">{crop.sowing_irrigation.spacing}</dd></div>
            <div><dt className="inline font-medium text-text-primary">{t('irrigationSchedule')}: </dt><dd className="inline">{crop.sowing_irrigation.irrigation_schedule}</dd></div>
            <div><dt className="inline font-medium text-text-primary">{t('waterRequirement')}: </dt><dd className="inline">{crop.sowing_irrigation.water_requirement}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {/* Fertilizer Schedule */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <FlaskConical className="h-4 w-4 text-rose-600" />{t('fertilizerSchedule')}
          </h3>
          <div className="space-y-2">
            {crop.fertilizer_schedule.map((f, i) => (
              <div key={i} className="flex gap-2 border-l-2 border-rose-200 pl-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className="bg-rose-50 text-rose-700 text-[10px]">{f.stage}</Badge>
                    <span className="text-xs font-medium">{f.fertilizer}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">{t('dose')}: {f.dose}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Growth Timeline */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-600" />{t('growthTimeline')}
          </h3>
          <div className="relative pl-4 space-y-3">
            <div className="absolute left-1.5 top-1 bottom-1 w-px bg-green-200" />
            {crop.growth_timeline.map((g, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-4 top-1 h-2.5 w-2.5 rounded-full bg-mint/100" />
                <p className="text-xs font-semibold text-text-primary">{g.stage} <span className="text-text-muted font-normal">&middot; {g.age_range}</span></p>
                <p className="text-[11px] text-text-secondary">{g.milestone}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Pests & Diseases */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-orange-600" />{t('commonPestsDiseases')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {crop.common_pests_diseases.map((d) => (
              <Badge key={d} className="bg-orange-50 text-orange-700 text-[10px]">{d}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Economics */}
      {crop.economics && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4 text-emerald-600" />{t('quickFacts')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(crop.economics).map(([k, v]) => (
                <div key={k} className="bg-mint/10 border border-emerald-100 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary capitalize">{k.replace(/_/g, ' ')}</p>
                  <p className="text-xs font-semibold text-mint">{String(v)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
