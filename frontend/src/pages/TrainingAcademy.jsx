import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import TrainingAcademyScene3D from '../components/TrainingAcademyScene3D';
import { Card, CardContent } from '../components/ui/card';
import appClient from '../api/appClient';
import { useLang } from '../lib/i18n';

/**
 * Spec #48 "Training Academy": a progression-based learning
 * environment where courses map to scenes and progress maps to a
 * growth metaphor. There is no per-farmer course-completion field in
 * the real TrainingResource entity, so this page does NOT invent a
 * "% complete" number -- it honestly groups the same real
 * TrainingResource list Training Center already fetches into
 * "learning paths" by real category, and the 3D growth markers scale
 * by each category's real resource count (spec #71: real data drives
 * the visual, nothing fabricated). This turns what was a "coming
 * soon" stub into a genuine, working overview page.
 */
const CATEGORY_LABELS = {
  crop: 'Crop',
  livestock: 'Livestock',
  soil: 'Soil',
  irrigation: 'Irrigation',
  machinery: 'Machinery',
  marketing: 'Marketing',
};

export default function TrainingAcademy() {
  const { t } = useLang();
  const [resources, setResources] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    appClient.entities.TrainingResource.list('title', 200).then(setResources).catch(() => {});
  }, []);

  const categories = Object.keys(CATEGORY_LABELS)
    .map((key) => ({
      category: key,
      label: CATEGORY_LABELS[key],
      count: resources.filter((r) => r.category === key).length,
    }))
    .filter((c) => c.count > 0);

  return (
    <div>
      <PageHeader title={t('trainingAcademyTitle')} icon={GraduationCap} />
      <p className="text-xs text-lt-text-secondary mb-3">
        Your learning paths, grouped from the real Training Center library -- taller sprouts mean more resources available in that path.
      </p>

      {categories.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-lt-text-muted">No training resources available yet.</CardContent></Card>
      ) : (
        <>
          <TrainingAcademyScene3D categories={categories} activeCategory={active} />

          <div className="space-y-2">
            {categories.map((c) => (
              <Link key={c.category} to={`/training-center`} onMouseEnter={() => setActive(c.category)}>
                <Card className="hover:border-lt-success/40">
                  <CardContent className="pt-3 pb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{c.label}</p>
                      <p className="text-xs text-lt-text-muted">{c.count} resource{c.count === 1 ? '' : 's'} available</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-lt-text-muted" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
