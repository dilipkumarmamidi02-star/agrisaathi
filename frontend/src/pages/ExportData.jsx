import { DownloadCloud } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DynamicScenePhoto from '../components/DynamicScenePhoto';
import { useLang } from '../lib/i18n';

// Real, already-wired datasets this section will export once built —
// matches the entity types used elsewhere in the app (Farm Ledger,
// Harvest Records, Soil Passport, Documents). No invented categories.
const DATASETS = ['Farm Ledger', 'Harvest Records', 'Soil Records', 'Documents'];

export default function ExportData() {
  const { t } = useLang();
  return (
    <div>
      <PageHeader title={t('exportDataTitle')} icon={DownloadCloud} />
      <DynamicScenePhoto fallbackQuery="digital agriculture technology" datasetCount={DATASETS.length} />
      <p className="text-sm text-lt-text-secondary mb-3">This section is coming soon.</p>
      <p className="text-xs text-lt-text-muted">
        When it ships, it will let you export raw data from: {DATASETS.join(', ')}.
        In the meantime, <span className="text-lt-primary-dark font-medium">Export Reports</span> already
        generates a PDF summary of your ledger, harvest and soil records.
      </p>
    </div>
  );
}
