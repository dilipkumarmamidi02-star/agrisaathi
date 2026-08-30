import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

export default function YieldBenchmarks() {
  const { t } = useLang();
  return (
    <div>
      <PageHeader title={t('yieldBenchmarksTitle')} />
      <p className="text-sm text-text-secondary">This section is coming soon.</p>
    </div>
  );
}
