import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

export default function InsuranceVault() {
  const { t } = useLang();
  return (
    <div>
      <PageHeader title={t('insuranceVaultTitle')} />
      <p className="text-sm text-lt-text-secondary">This section is coming soon.</p>
    </div>
  );
}
