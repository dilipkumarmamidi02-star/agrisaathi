import { useLang } from '../lib/i18n';


export default function PlaceholderPage({ title, icon, description }) {
  const { t } = useLang();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{icon} {title}</h1>
      <p className="text-lt-text-secondary mt-2">{description}</p>
      <div className="mt-8 p-8 bg-lt-bg rounded-xl border-2 border-dashed border-lt-border text-center">
        <p className="text-lt-text-muted">{t('featureInDevelopment')}</p>
        <p className="text-sm text-lt-text-muted mt-2">{t('checkBackSoon')}</p>
      </div>
    </div>
  );
}
