import { Phase7RouteIntegration } from "../components/phase7";

import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

export default function YieldBenchmarks() {
  const { t } = useLang();
  return (
    <div>
      <PageHeader title={t('yieldBenchmarksTitle')} />
      <p className="text-sm text-lt-text-secondary">This section is coming soon.</p>
    </div>
  );
}
