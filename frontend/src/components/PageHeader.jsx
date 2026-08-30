import { useLang } from '../lib/i18n';

export default function PageHeader({ titleKey, title, icon: Icon, subtitle }) {
  const { t } = useLang();
  const displayTitle = title || (t ? t(titleKey) : titleKey);

  return (
    <div className="flex items-center gap-3 mb-4">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-lt-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-lt-primary-dark" />
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold text-lt-text">{displayTitle}</h1>
        {subtitle && <p className="text-sm text-lt-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}
