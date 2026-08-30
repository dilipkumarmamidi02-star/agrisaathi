import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Mic, Camera, Droplets, Sprout, MapPin, Wallet, Stethoscope, TrendingUp, FlaskConical, ShieldCheck, Landmark, Wheat, User, Banknote, MessageSquare, CloudRain, Store, GraduationCap, FolderArchive, ShieldPlus, Package, ListTodo, Bug, Gauge, UserCheck, Trophy, BellRing, Contact, Bell, FileSpreadsheet, PawPrint } from 'lucide-react';
import api from '../api/apiClient';
import { useLang } from '../lib/i18n';

export default function Home() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [health, setHealth] = useState(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    api.get('/health').then(res => setHealth(res.data)).catch(() => {});
    api.get('/api/weather/current?lat=17.3850&lon=78.4867')
      .then(res => setWeather(res.data))
      .catch(() => {});
  }, []);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported on this browser'); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      navigate(`/speak-to-agrisaathi?q=${encodeURIComponent(text)}`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const quickLinks = [
    { to: '/fertilizer', icon: Droplets, label: t('fertilizer'), color: 'bg-cyan-500/10 text-cyan-400' },
    { to: '/soil-passport', icon: Sprout, label: t('soil'), color: 'bg-mint/10 text-mint' },
    { to: '/crop-planner', icon: TrendingUp, label: t('planner'), color: 'bg-purple-50 text-purple-700' },
    { to: '/livestock-care', icon: Stethoscope, label: t('livestock'), color: 'bg-rose-50 text-rose-700' },
    { to: '/market-prices', icon: Wallet, label: t('marketPrices'), color: 'bg-orange-50 text-orange-700' },
    { to: '/farm-ledger', icon: FileSpreadsheet, label: t('ledger'), color: 'bg-lime-50 text-lime-700' },
    { to: '/crop-passport', icon: ShieldCheck, label: t('cropPassportTitle'), color: 'bg-mint/10 text-mint' },
    { to: '/schemes', icon: Landmark, label: t('govSchemes'), color: 'bg-cyan-500/10 text-cyan-400' },
    { to: '/sensor-lab', icon: FlaskConical, label: t('sensorLab'), color: 'bg-cyan-50 text-cyan-700' },
    { to: '/irrigation-planner', icon: Droplets, label: t('irrigation'), color: 'bg-cyan-50 text-cyan-700' },
    { to: '/training-center', icon: GraduationCap, label: t('training'), color: 'bg-teal-50 text-teal-700' },
    { to: '/pest-library', icon: Bug, label: t('pestLibrary'), color: 'bg-red-500/10 text-red-400' },
    { to: '/expert-directory', icon: UserCheck, label: t('experts'), color: 'bg-cyan-500/10 text-cyan-400' },
    { to: '/farm-notifications', icon: BellRing, label: t('notifications'), color: 'bg-cyan-50 text-cyan-700' },
  ];

  return (
    <div className="space-y-5 px-4 pt-6 pb-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-green-800">🌾 AgriSaathi</h1>
          <p className="text-sm text-text-secondary">One Voice, Every Acre, Every Plot</p>
        </div>
        <div className="flex gap-2">
          <Link to="/alerts-center"><Bell className="h-5 w-5 text-text-secondary" /></Link>
          <Link to="/profile-settings"><User className="h-5 w-5 text-text-secondary" /></Link>
        </div>
      </div>

      {health && (
        <div className="bg-mint/10 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <span className="text-sm text-mint">✅ Backend: {health.status} ({health.version})</span>
        </div>
      )}

      <div className="text-center py-2">
        <h2 className="text-lg font-semibold text-text-primary">{t('speakToAgriSaathi')}</h2>
        <p className="text-sm text-text-secondary">{t('tapAndSpeak')}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={startVoice}
          className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition-all ${listening ? 'bg-red-500/100 animate-pulse scale-105' : 'bg-green-600 hover:bg-green-700'}`}
        >
          <Mic className="h-10 w-10" />
        </button>
        <span className="text-sm font-medium text-text-secondary">{listening ? 'Listening…' : 'Tap to speak'}</span>
      </div>

      {transcript && (
        <div className="bg-mint/10 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-text-primary">"{transcript}"</p>
        </div>
      )}

      {/* Weather Card */}
      <Link to="/weather" className="block bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg hover:opacity-95 transition-opacity">
        {weather && weather.temperature != null ? (
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold">{Math.round(weather.temperature)}°C</span>
              </div>
              <p className="text-blue-100 capitalize text-lg">{weather.description}</p>
            </div>
            <div className="text-right text-sm text-blue-100">
              <div className="flex items-center gap-1 justify-end">💧 {weather.humidity}%</div>
              <div className="flex items-center gap-1 justify-end">💨 {weather.wind_speed} m/s</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-blue-100 py-4">{t('weatherDataUnavailable')}</div>
        )}
      </Link>

      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">{t('allTools')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-1.5">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-[11px] text-text-secondary text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
