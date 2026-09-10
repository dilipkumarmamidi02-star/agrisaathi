import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Home, Camera, MapPin, Sprout, PawPrint, User, LayoutDashboard,
  Mic, CalendarDays, Droplets, Bug, FlaskConical, CloudRain,
  Wallet, Landmark, Store, BookOpen, MessageSquare, FileSpreadsheet,
  Bell, Search, Menu, X, Boxes, Handshake, ShoppingCart, Truck,
  Warehouse, Trophy, LifeBuoy, Map,
} from 'lucide-react';
import { useLang } from '../lib/i18n';
import { useUserRole } from '../hooks/useUserRole';

// Desktop sidebar nav — maps the reference-mockup labels onto real,
// already-existing routes (confirmed against App.jsx). No new pages
// invented; a few mockup labels map onto the closest real equivalent
// (e.g. "Crop Calendar" -> /crop-planner,
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
      { path: '/soil-passport', icon: FlaskConical, label: 'Soil Health' },
      { path: '/weather', icon: CloudRain, label: 'Weather' },
    ],
  },
  {
    heading: 'Market & Support',
    items: [
      { path: '/market-prices', icon: Wallet, label: 'Mandi Prices' },
      { path: '/schemes', icon: Landmark, label: 'Govt Schemes' },
      { path: '/alerts-center', icon: Bell, label: 'Price Alerts' },
    ],
  },
  {
    heading: 'Sell & Manage',
    items: [
      { path: '/quality-checker', icon: Search, label: 'Quality Checker' },
      { path: '/my-lots', icon: FileSpreadsheet, label: 'My Lots' },
      { path: '/offers', icon: MessageSquare, label: 'Offers' },
      { path: '/orders', icon: FileSpreadsheet, label: 'Orders' },
      { path: '/storage', icon: Warehouse, label: 'Storage' },
      { path: '/logistics', icon: Truck, label: 'Logistics' },
      { path: '/payments', icon: Wallet, label: 'Payments' },
      { path: '/support', icon: LifeBuoy, label: 'Support' },
    ],
  },
];

const SUPPORTER_SIDEBAR_SECTIONS = [
  {
    heading: 'Supporter',
    items: [
      { path: '/supporter-dashboard', icon: LayoutDashboard, label: 'Supporter Dashboard' },
      { path: '/lots-marketplace', icon: Boxes, label: 'Lots Marketplace' },
      { path: '/my-offers', icon: Handshake, label: 'My Offers' },
      { path: '/orders', icon: ShoppingCart, label: 'Orders' },
      { path: '/logistics', icon: Truck, label: 'Logistics' },
      { path: '/storage', icon: Warehouse, label: 'Storage' },
      { path: '/demand-map', icon: Map, label: 'Demand Overview' },
      { path: '/trust-rankings', icon: Trophy, label: 'Trust Rankings' },
      { path: '/support-tickets', icon: LifeBuoy, label: 'Support' },
    ],
  },
];


// ============================================================
// ADMIN SIDEBAR
// Completely separate from the farmer navigation.
// ============================================================
const ADMIN_SIDEBAR_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
  { path: '/admin/users', icon: User, label: 'Users' },
  { path: '/admin/grievances', icon: MessageSquare, label: 'Grievances' },
  { path: '/admin/lots', icon: FileSpreadsheet, label: 'Lots' },
  { path: '/admin/quality-trends', icon: Search, label: 'Quality Trends' },
  { path: '/trust-rankings', icon: LayoutDashboard, label: 'Trust Rankings' },
  { path: '/market-prices', icon: Wallet, label: 'Market Prices' },
];

// Mobile bottom nav — unchanged from the existing app, kept exactly as-is
// so nothing on mobile breaks. Only shown below the md breakpoint.
const MOBILE_NAV_ITEMS = [
  { path: '/', icon: Home, label: 'home' },
  { path: '/diagnose', icon: Camera, label: 'diagnose' },
  { path: '/near-me', icon: MapPin, label: 'nearMe' },
  { path: '/dashboard', icon: User, label: 'dashboard' },
];

const SUPPORTER_MOBILE_NAV_ITEMS = [
  { path: '/supporter-dashboard', icon: LayoutDashboard, label: 'dashboard' },
  { path: '/lots-marketplace', icon: Boxes, label: 'Marketplace' },
  { path: '/my-offers', icon: Handshake, label: 'My Offers' },
  { path: '/orders', icon: ShoppingCart, label: 'Orders' },
];

export default function Layout({ children }) {
  const { t } = useLang();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    role,
    loading: roleLoading,
    displayName,
    email,
  } = useUserRole();

  const userDisplayName =
    displayName ||
    (email ? email.split('@')[0] : 'Admin');


  const isActive = (path) =>
    location.pathname === path
    || (path === '/animal-encyclopedia' && location.pathname.startsWith('/animal-encyclopedia'))
    || (path === '/crops' && location.pathname.startsWith('/crop-encyclopedia'));

  const BARE_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth-consent'];
  if (BARE_ROUTES.includes(location.pathname)) {
    return children;
  }

  // ============================================================
  // ADMIN LAYOUT
  // Admins NEVER see the farmer sidebar/navigation.
  // ============================================================
  if (!roleLoading && role === 'admin') {
    return (
      <div className="min-h-screen bg-lt-bg md:flex">

        {/* ADMIN SIDEBAR */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-lt-card border-r border-lt-border">

          <div className="px-6 py-6">
            <div className="flex items-center gap-2">
              <Sprout className="h-6 w-6 text-lt-primary" />
              <span
                className="text-xl font-bold text-lt-primary"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                AgriSaathi
              </span>
            </div>

            <p className="mt-1 ml-8 text-[10px] uppercase tracking-[0.18em] text-lt-text-muted">
              Better Markets
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">

            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-lt-text-muted">
              Admin Panel
            </p>

            <div className="space-y-1">
              {ADMIN_SIDEBAR_ITEMS.map(({ path, icon: Icon, label }) => {
                const active =
                  location.pathname === path ||
                  (path !== '/admin' &&
                    location.pathname.startsWith(path));

                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
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

          </nav>

          {/* ADMIN USER / LOGOUT */}
          <div className="p-4 border-t border-lt-border">

            <div className="mb-3 px-2">
              <p className="text-[10px] uppercase tracking-wide text-lt-text-muted">
                Admin Panel
              </p>

              <p className="mt-1 text-sm font-semibold text-lt-text truncate">
                {userDisplayName}
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const { signOut } = await import('firebase/auth');
                  const { auth } = await import('../lib/firebase');
                  await signOut(auth);
                } catch (error) {
                  console.error('Admin logout failed:', error);
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-lt-border px-3 py-2 text-sm text-lt-text hover:bg-lt-bg"
            >
              Logout
            </button>

          </div>

        </aside>

        {/* ADMIN TOP BAR */}
        <div className="hidden md:flex md:fixed md:top-0 md:left-64 md:right-0 md:h-16 bg-lt-card border-b border-lt-border items-center justify-between px-6 z-30">

          <div>
            <p className="text-sm font-semibold text-lt-text">
              Admin Dashboard
            </p>
            <p className="text-xs text-lt-text-muted">
              Platform governance and oversight
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-full bg-lt-primary/10 flex items-center justify-center">
              <User size={16} className="text-lt-primary" />
            </span>

            <span className="text-sm font-medium text-lt-text">
              {userDisplayName}
            </span>
          </div>

        </div>

        {/* ADMIN MOBILE HEADER */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-lt-card border-b border-lt-border z-40 flex items-center justify-between px-4">

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open admin navigation"
            className="h-10 w-10 rounded-lg flex items-center justify-center text-lt-text hover:bg-lt-bg"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-lt-primary" />
            <span
              className="text-lg font-bold text-lt-primary"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              AgriSaathi
            </span>
          </div>

          <span className="h-10 w-10 rounded-full bg-lt-primary/10 flex items-center justify-center">
            <User size={18} className="text-lt-primary" />
          </span>

        </div>

        {/* ADMIN MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60]">

            <button
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/40"
            />

            <aside className="absolute top-0 left-0 bottom-0 w-[86%] max-w-sm bg-lt-card shadow-2xl flex flex-col">

              <div className="h-16 shrink-0 px-5 border-b border-lt-border flex items-center justify-between">

                <div className="flex items-center gap-2">
                  <Sprout className="h-6 w-6 text-lt-primary" />

                  <div>
                    <span
                      className="block text-lg font-bold text-lt-primary"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      AgriSaathi
                    </span>

                    <span className="block text-[9px] uppercase tracking-wider text-lt-text-muted">
                      Better Markets
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close admin navigation"
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-lt-text hover:bg-lt-bg"
                >
                  <X size={24} />
                </button>

              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">

                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-lt-text-muted">
                  Admin Panel
                </p>

                <div className="space-y-1">

                  {ADMIN_SIDEBAR_ITEMS.map(({ path, icon: Icon, label }) => {
                    const active =
                      location.pathname === path ||
                      (path !== '/admin' &&
                        location.pathname.startsWith(path));

                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                          active
                            ? 'bg-lt-primary text-white font-medium'
                            : 'text-lt-text hover:bg-lt-bg'
                        }`}
                      >
                        <Icon size={19} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}

                </div>

              </nav>

              <div className="p-3 border-t border-lt-border">

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const { signOut } = await import('firebase/auth');
                      const { auth } = await import('../lib/firebase');
                      await signOut(auth);
                    } catch (error) {
                      console.error('Admin logout failed:', error);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-lt-border px-3 py-3 text-sm text-lt-text hover:bg-lt-bg"
                >
                  Logout
                </button>

              </div>

            </aside>

          </div>
        )}

        {/* ADMIN CONTENT */}
        <div className="flex-1 md:ml-64 pt-16 md:pt-16 pb-0">
          {children}
        </div>

      </div>
    );
  }

  const isSupporter = !roleLoading && role === 'supporter';
  const isFarmer = !roleLoading && role === 'farmer';

  // Never silently give an unknown/unresolved role the Farmer navigation.
  // Farmer and Supporter have completely separate navigation structures.
  const activeSections =
    isSupporter
      ? SUPPORTER_SIDEBAR_SECTIONS
      : isFarmer
        ? SIDEBAR_SECTIONS
        : [];

  if (!roleLoading) {
    console.debug('🌱 AgriSaathi Layout Role:', {
      role,
      isFarmer,
      isSupporter,
      email,
      displayName,
    });
  }

  // ============================================================
  // NORMAL FARMER / SUPPORTER LAYOUT
  // ============================================================
  return (
    <div className="min-h-screen bg-lt-bg md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-lt-card border-r border-lt-border">
        <div className="px-6 py-6 flex items-center gap-2">
          <Sprout className="h-6 w-6 text-lt-primary" />
          <span className="text-xl font-bold text-lt-primary" style={{ fontFamily: 'Georgia, serif' }}>AgriSaathi</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
          {activeSections.map((section, i) => (
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
      <div className="hidden md:flex md:fixed md:top-0 md:left-64 md:right-0 md:h-16 bg-lt-card border-b border-lt-border items-center justify-end px-6 z-30">
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
      <div className="flex-1 md:ml-64 pt-16 md:pt-16 pb-20 md:pb-0">
        {children}
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-lt-card border-b border-lt-border z-40 flex items-center justify-between px-4">

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          className="h-10 w-10 rounded-lg flex items-center justify-center text-lt-text hover:bg-lt-bg active:bg-lt-bg"
        >
          <Menu size={24} />
        </button>

        <Link
          to={isSupporter ? '/supporter-dashboard' : '/'}
          className="flex items-center gap-2"
        >
          <Sprout className="h-6 w-6 text-lt-primary" />
          <span
            className="text-lg font-bold text-lt-primary"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            AgriSaathi
          </span>
        </Link>

        <Link
          to="/profile-settings"
          aria-label="Profile"
          className="h-10 w-10 rounded-full bg-lt-primary/10 flex items-center justify-center"
        >
          <User size={18} className="text-lt-primary" />
        </Link>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">

          {/* Overlay */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* Drawer */}
          <aside className="absolute top-0 left-0 bottom-0 w-[86%] max-w-sm bg-lt-card shadow-2xl flex flex-col">

            {/* Drawer header */}
            <div className="h-16 shrink-0 px-5 border-b border-lt-border flex items-center justify-between">

              <Link
                to={isSupporter ? '/supporter-dashboard' : '/'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <Sprout className="h-6 w-6 text-lt-primary" />

                <div>
                  <span
                    className="block text-lg font-bold text-lt-primary"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    AgriSaathi
                  </span>

                  {isSupporter && (
                    <span className="block text-[9px] uppercase tracking-wider text-lt-text-muted">
                      Supporter Portal
                    </span>
                  )}
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="h-10 w-10 rounded-lg flex items-center justify-center text-lt-text hover:bg-lt-bg"
              >
                <X size={24} />
              </button>

            </div>

            {/* Drawer navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">

              {activeSections.map((section, i) => (
                <div
                  key={i}
                  className={i > 0 ? 'mt-6' : ''}
                >

                  {section.heading && (
                    <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-lt-text-muted">
                      {section.heading}
                    </p>
                  )}

                  <div className="space-y-1">

                    {section.items.map(({ path, icon: Icon, label }) => {
                      const active = isActive(path);

                      return (
                        <Link
                          key={path}
                          to={path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                            active
                              ? 'bg-lt-primary text-white font-medium'
                              : 'text-lt-text hover:bg-lt-bg'
                          }`}
                        >
                          <Icon size={19} />
                          <span>{label}</span>
                        </Link>
                      );
                    })}

                  </div>

                </div>
              ))}

            </nav>

            {/* Mobile help */}
            <div className="shrink-0 p-3 border-t border-lt-border">

              <Link
                to="/speak-to-agrisaathi"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-lt-bg border border-lt-border px-3 py-3"
              >
                <span className="h-9 w-9 rounded-lg bg-lt-primary/10 flex items-center justify-center shrink-0">
                  <Mic size={18} className="text-lt-primary" />
                </span>

                <span>
                  <span className="block text-xs text-lt-text-muted">
                    Need Help?
                  </span>

                  <span className="font-medium text-sm text-lt-text">
                    Talk to AI Saathi
                  </span>
                </span>
              </Link>

            </div>

          </aside>
        </div>
      )}

      {/* Mobile quick navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-lt-card/95 backdrop-blur-md border-t border-lt-border z-40">

        <div className="flex justify-around items-center h-16 max-w-md mx-auto">

          {(isSupporter ? SUPPORTER_MOBILE_NAV_ITEMS : MOBILE_NAV_ITEMS).map(({ path, icon: Icon, label }) => {
            const active = isActive(path);

            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                  active
                    ? 'text-lt-primary'
                    : 'text-lt-text-muted'
                }`}
              >
                <Icon
                  size={21}
                  className={active ? 'stroke-2' : 'stroke-1'}
                />

                <span
                  className={`text-[10px] uppercase tracking-wide ${
                    active ? 'font-semibold' : ''
                  }`}
                >
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
