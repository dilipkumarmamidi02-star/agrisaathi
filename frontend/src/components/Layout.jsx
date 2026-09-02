import { Link, useLocation } from 'react-router-dom';
import {
  Home, Camera, MapPin, Sprout, PawPrint, User, LayoutDashboard,
  Mic, CalendarDays, Droplets, Bug, FlaskConical, CloudRain,
  Wallet, Landmark, Store, BookOpen, MessageSquare, FileSpreadsheet,
  Bell, Search,
} from 'lucide-react';
import { useLang } from '../lib/i18n';

// Desktop sidebar nav — maps the reference-mockup labels onto real,
// already-existing routes (confirmed against App.jsx). No new pages
// invented; a few mockup labels map onto the closest real equivalent
// (e.g. "Crop Calendar" -> /crop-planner, "Farm Diary" -> /farm-ledger,
// "AI Saathi" -> /speak-to-agrisaathi, the actual voice-first feature).
const SIDEBAR_SECTIONS = [
  {
    items: [
      { path: '/', icon: Home, label: 'Home' },
      { path: '/dashboard', icon: LayoutDashboard, label: 'My Farm' },
      { path: '/speak-to-agrisaathi', icon: Mic, label: 'AI Saathi' },
      { path: '/crop-planner', icon: CalendarDays, label: 'Crop Calendar' },
    ],
  },
  {
    heading: 'Farm Tools',
    items: [
      { path: '/diagnose', icon: Camera, label: 'Diagnosis' },
      { path: '/crops', icon: Sprout, label: 'Crops' },
      { path: '/animal-encyclopedia', icon: PawPrint, label: 'Animals' },
      { path: '/fertilizer', icon: Droplets, label: 'Fertilizers' },
      { path: '/pest-library', icon: Bug, label: 'Pesticides' },
      { path: '/irrigation-planner', icon: Droplets, label: 'Irrigation' },
      { path: '/soil-passport', icon: FlaskConical, label: 'Soil Health' },
      { path: '/weather', icon: CloudRain, label: 'Weather' },
    ],
  },
  {
    heading: 'Market & Support',
    items: [
      { path: '/market-prices', icon: Wallet, label: 'Mandi Prices' },
      { path: '/schemes', icon: Landmark, label: 'Govt Schemes' },
      { path: '/input-marketplace', icon: Store, label: 'MarketPlace' },
      { path: '/training-center', icon: BookOpen, label: 'Knowledge Hub' },
      { path: '/community-forum', icon: MessageSquare, label: 'Community' },
      { path: '/farm-ledger', icon: FileSpreadsheet, label: 'Farm Diary' },
    ],
  },
];

// Mobile bottom nav — unchanged from the existing app, kept exactly as-is
// so nothing on mobile breaks. Only shown below the md breakpoint.
const MOBILE_NAV_ITEMS = [
  { path: '/', icon: Home, label: 'home' },
  { path: '/diagnose', icon: Camera, label: 'diagnose' },
  { path: '/near-me', icon: MapPin, label: 'nearMe' },
  { path: '/crops', icon: Sprout, label: 'crops' },
  { path: '/animal-encyclopedia', icon: PawPrint, label: 'animals' },
  { path: '/dashboard', icon: User, label: 'dashboard' },
];

export default function Layout({ children }) {
  const { t } = useLang();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
    || (path === '/animal-encyclopedia' && location.pathname.startsWith('/animal-encyclopedia'))
    || (path === '/crops' && location.pathname.startsWith('/crop-encyclopedia'));

  return (
    <div className="min-h-screen bg-lt-bg md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-lt-card border-r border-lt-border">
        <div className="px-6 py-6 flex items-center gap-2">
          <Sprout className="h-6 w-6 text-lt-primary" />
          <span className="text-xl font-bold text-lt-primary" style={{ fontFamily: 'Georgia, serif' }}>AgriSaathi</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
          {SIDEBAR_SECTIONS.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-lt-text-muted">
                  {section.heading}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ path, icon: Icon, label }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-lt-primary text-white font-medium'
                          : 'text-lt-text hover:bg-lt-bg'
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3">
          <Link
            to="/speak-to-agrisaathi"
            className="flex items-center gap-2 rounded-xl bg-lt-bg border border-lt-border px-3 py-3 text-sm text-lt-text hover:bg-lt-primary/5"
          >
            <Mic size={16} className="text-lt-primary" />
            <span>
              <span className="block text-xs text-lt-text-muted">Need Help?</span>
              <span className="font-medium">Talk to AI Saathi</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Desktop top bar */}
      <div className="hidden md:flex md:fixed md:top-0 md:left-64 md:right-0 md:h-16 bg-lt-card border-b border-lt-border items-center justify-between px-6 z-30">
        <div className="flex items-center gap-2 text-lt-text-muted text-sm w-80">
          <Search size={16} />
          <span>Search anything...</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/alerts-center" className="relative text-lt-text-muted hover:text-lt-text">
            <Bell size={20} />
          </Link>
          <Link to="/profile-settings" className="flex items-center gap-2 text-sm text-lt-text">
            <span className="h-8 w-8 rounded-full bg-lt-primary/10 flex items-center justify-center">
              <User size={16} className="text-lt-primary" />
            </span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 md:pt-16 pb-20 md:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav — unchanged, mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-lt-card/90 backdrop-blur-md border-t border-lt-border z-40">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {MOBILE_NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                  active ? 'text-lt-primary' : 'text-lt-text-muted'
                }`}
              >
                <Icon size={22} className={active ? 'stroke-2' : 'stroke-1'} />
                <span className={`text-[10px] uppercase tracking-wide ${active ? 'font-semibold' : ''}`}>
                  {t(label)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
