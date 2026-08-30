import { Users, Sprout, Stethoscope, GraduationCap, Landmark, Phone } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const EXPERT_TYPES = [
  { icon: Sprout, title: 'Agronomist', description: 'Crop disease, fertilizer & soil advice', helpline: '1800-180-1551' },
  { icon: Stethoscope, title: 'Veterinarian', description: 'Livestock, poultry & fish health', helpline: '1962' },
  { icon: GraduationCap, title: 'KVK Expert', description: 'Krishi Vigyan Kendra farm scientist — see Near Me for your nearest KVK contact', helpline: null },
  { icon: Landmark, title: 'Agriculture Officer', description: 'Schemes, insurance & subsidies', helpline: '1800-180-1551' },
];

export default function ExpertDirectory() {
  const { t } = useLang();
  return (
    <div>
      <PageHeader title={t('expertDirectoryTitle')} icon={Users} />
      <p className="text-xs text-gray-500 mb-3">
        Connect with the right expert for your farm issue. For a KVK scientist near you specifically, use Near Me — it lists actual KVK contacts from the ICAR directory.
      </p>

      <div className="space-y-2">
        {EXPERT_TYPES.map((e) => (
          <Card key={e.title}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-50">
                <e.icon className="h-5 w-5 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-gray-500">{e.description}</p>
              </div>
              {e.helpline && (
                <a href={`tel:${e.helpline}`} className="p-2 rounded-full bg-green-600 text-white shrink-0" aria-label={`Call ${e.title} helpline`}>
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
