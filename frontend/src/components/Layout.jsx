import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, MapPin, Sprout, PawPrint, User, Mic, X } from 'lucide-react';
import { useLang } from '../lib/i18n';

export default function Layout({ children }) {
  const { t } = useLang();
  const location = useLocation();
  const [showMic, setShowMic] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: t('home') },
    { path: '/diagnose', icon: Camera, label: t('diagnose') },
    { path: '/near-me', icon: MapPin, label: t('nearMe') },
    { path: '/crops', icon: Sprout, label: t('crops') },
    { path: '/animal-encyclopedia', icon: PawPrint, label: t('animals') },
    { path: '/dashboard', icon: User, label: t('dashboard') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <button 
        onClick={() => setShowMic(!showMic)} 
        className="fixed bottom-24 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all"
      >
        <Mic size={24} />
      </button>
      
      {showMic && (
        <div className="fixed bottom-36 right-4 z-50 bg-white rounded-2xl shadow-2xl p-4 w-72 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Listening...</span>
            <button onClick={() => setShowMic(false)} className="ml-auto text-gray-400">
              <X size={16} />
            </button>
          </div>
          <div className="mt-2 p-3 bg-gray-100 rounded-xl text-sm text-gray-500">
            "Identify this plant disease"
          </div>
          <div className="mt-2 flex gap-2">
            <button className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">{t('cropSingular')}</button>
            <button className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">{t('livestock')}</button>
            <button className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">{t('weather')}</button>
          </div>
        </div>
      )}

      <div>{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
              || (path === '/animal-encyclopedia' && location.pathname.startsWith('/animal-encyclopedia'))
              || (path === '/crops' && location.pathname.startsWith('/crop-encyclopedia'));
            return (
              <Link key={path} to={path} className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
                <Icon size={22} className={isActive ? 'stroke-2' : 'stroke-1'} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
