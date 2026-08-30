import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, MapPin, Sprout, PawPrint, User } from 'lucide-react';
import { useLang } from '../lib/i18n';

export default function Layout({ children }) {
  const { t } = useLang();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: t('home') },
    { path: '/diagnose', icon: Camera, label: t('diagnose') },
    { path: '/near-me', icon: MapPin, label: t('nearMe') },
    { path: '/crops', icon: Sprout, label: t('crops') },
    { path: '/animal-encyclopedia', icon: PawPrint, label: t('animals') },
    { path: '/dashboard', icon: User, label: t('dashboard') },
  ];

  return (
    <div className="min-h-screen bg-ink pb-20">
      <div>{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border z-40">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
              || (path === '/animal-encyclopedia' && location.pathname.startsWith('/animal-encyclopedia'))
              || (path === '/crops' && location.pathname.startsWith('/crop-encyclopedia'));
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                <Icon size={22} className={isActive ? 'stroke-2' : 'stroke-1'} />
                <span className={`text-[10px] font-mono uppercase tracking-wide ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
