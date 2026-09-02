import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

export default function TrainingAcademy() {
  const { t } = useLang();
  return (
    <div>
      <PageHeader title={t('trainingAcademyTitle')} />
      <p className="text-sm text-lt-text-secondary">This section is coming soon.</p>
    </div>
  );
}
