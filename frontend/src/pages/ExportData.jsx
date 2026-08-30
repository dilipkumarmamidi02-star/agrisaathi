import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

export default function ExportData() {
  const { t } = useLang();
  return (
    <div>
      <PageHeader title={t('exportDataTitle')} />
      <p className="text-sm text-gray-500">This section is coming soon.</p>
    </div>
  );
}
