import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import DynamicScenePhoto from '../components/DynamicScenePhoto';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

const inputClass =
  'w-full bg-[#0a0f0d] border border-green-900/50 focus:border-green-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 transition-colors';
const labelClass = 'block text-xs font-mono uppercase tracking-wider text-gray-500 mb-1';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: account, 2: language + land details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    language: 'en',
    state: '',
    district: '',
    village: '',
    landSizeAcres: '',
    primaryCrop: '',
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Please fill in your name, email, and a password of at least 6 characters.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(credential.user, { displayName: form.name });

      await setDoc(doc(db, 'users', credential.user.uid), {
        name: form.name,
        email: form.email,
        language: form.language,
        landDetails: {
          state: form.state,
          district: form.district,
          village: form.village,
          landSizeAcres: form.landSizeAcres,
          primaryCrop: form.primaryCrop,
        },
        createdAt: new Date().toISOString(),
      });

      navigate('/');
    } catch (err) {
      setError(err?.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d] px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-500/10 blur-[120px]" />
      <DynamicScenePhoto fallbackQuery="farmer ploughing field with oxen" />

      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-between mb-6 font-mono text-xs text-green-400 tracking-widest uppercase">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            AUTH_NODE / REGISTER
          </span>
          <span className="text-gray-600">STEP_{step}/2</span>
        </div>

        <div className="bg-[#0f1512] border border-green-900/40 rounded-2xl p-6 shadow-[0_0_40px_-15px_rgba(34,197,94,0.25)]">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Create Your Account</h1>
          <p className="text-sm text-gray-500 mb-6">
            {step === 1 ? 'Account details' : 'Language & land details'}
          </p>

          {error && (
            <div className="mb-4 bg-red-950/60 border border-red-800/60 text-red-300 text-sm rounded-lg p-3 font-mono">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Full name</label>
                <input type="text" value={form.name} onChange={update('name')} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} onChange={update('email')} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  minLength={6}
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-400 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
              >
                Continue ▸
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Preferred language</label>
                <select value={form.language} onChange={update('language')} className={inputClass}>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" value={form.state} onChange={update('state')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>District</label>
                  <input type="text" value={form.district} onChange={update('district')} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Village / area</label>
                <input type="text" value={form.village} onChange={update('village')} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Land size (acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.landSizeAcres}
                    onChange={update('landSizeAcres')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Primary crop</label>
                  <input type="text" value={form.primaryCrop} onChange={update('primaryCrop')} className={inputClass} />
                </div>
              </div>

              <p className="text-xs text-gray-600 font-mono">You can change any of these later in Profile Settings.</p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-green-900/50 text-gray-300 hover:border-green-700 font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
                >
                  {loading ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green-400 font-medium hover:text-green-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
