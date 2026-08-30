import { useLang } from '../lib/i18n';


export default function PlaceholderPage({ title, icon, description }) {
  const { t } = useLang();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{icon} {title}</h1>
      <p className="text-gray-500 mt-2">{description}</p>
      <div className="mt-8 p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
        <p className="text-gray-400">{t('featureInDevelopment')}</p>
        <p className="text-sm text-gray-400 mt-2">{t('checkBackSoon')}</p>
      </div>
    </div>
  );
}
