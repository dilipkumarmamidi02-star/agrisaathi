import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import PincodeLocationFields from '../components/PincodeLocationFields';
import { useLocationContext } from '../lib/LocationContext';

// The 22 languages listed in the Eighth Schedule of the Indian
// Constitution, plus English (widely used as an official/associate
// official language across central and state government). Together
// these cover the official language(s) of every Indian state and UT.
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'as', label: 'অসমীয়া (Assamese)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'brx', label: 'बड़ो (Bodo)' },
  { code: 'doi', label: 'डोगरी (Dogri)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ks', label: 'कॉशुर / کٲشُر (Kashmiri)' },
  { code: 'gom', label: 'कोंकणी (Konkani)' },
  { code: 'mai', label: 'मैथिली (Maithili)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'mni', label: 'ꯃꯤꯇꯩꯂꯣꯟ (Manipuri / Meitei)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'ne', label: 'नेपाली (Nepali)' },
  { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'sa', label: 'संस्कृतम् (Sanskrit)' },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)' },
  { code: 'sd', label: 'سنڌي (Sindhi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ur', label: 'اردو (Urdu)' },
];

export default function ProfileSettings() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { location: contextLocation, setLocation: setContextLocation } = useLocationContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    language: 'en',
    landSizeAcres: '',
    primaryCrop: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            name: data.name || user.displayName || '',
            language: data.language || 'en',
            landSizeAcres: data.landDetails?.landSizeAcres || '',
            primaryCrop: data.landDetails?.primaryCrop || '',
          });
          if (data.landDetails?.state) {
            setContextLocation({
              state: data.landDetails.state,
              district: data.landDetails.district || '',
              village: data.landDetails.village || '',
            });
          }
        }
      } catch (err) {
        setError(err?.message || 'Could not load your profile.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (form.name.trim() && form.name.trim() !== user.displayName) {
        await updateProfile(user, { displayName: form.name.trim() });
      }
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        language: form.language,
        landDetails: {
          state: contextLocation.state,
          district: contextLocation.district,
          village: contextLocation.village,
          landSizeAcres: form.landSizeAcres,
          primaryCrop: form.primaryCrop,
        },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err?.message || 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-hover">
        <p className="text-sm text-text-secondary">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-hover px-4 py-10">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-sm border border-border p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Profile settings</h1>
        <p className="text-sm text-text-secondary mb-6">Update your language and land details</p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-200 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-mint/10 border border-green-200 text-mint text-sm rounded-lg p-3">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Preferred language</label>
            <select
              value={form.language}
              onChange={update('language')}
              className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Farm location</label>
            <PincodeLocationFields />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Land size (acres)</label>
              <input
                type="number"
                step="0.1"
                value={form.landSizeAcres}
                onChange={update('landSizeAcres')}
                className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Primary crop</label>
              <input
                type="text"
                value={form.primaryCrop}
                onChange={update('primaryCrop')}
                className="w-full border border-border-strong rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full mt-3 border border-red-200 text-red-600 hover:bg-red-500/10 font-medium py-2.5 rounded-lg text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
