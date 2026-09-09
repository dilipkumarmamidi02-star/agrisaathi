import { useState } from 'react';
import '../styles/auth.css';
import { useNavigate, Link } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
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

const SUPPORTER_TYPES = [
  ['fpo_farmer_group', 'FPO / Farmer Group'],
  ['buyer', 'Buyer'],
  ['trader', 'Trader'],
  ['processor', 'Processor'],
  ['institutional_buyer', 'Institutional Buyer'],
  ['logistics_provider', 'Logistics Provider'],
  ['warehouse_provider', 'Warehouse Provider'],
  ['cold_storage_provider', 'Cold Storage Provider'],
  ['quality_service_provider', 'Quality Service Provider'],
  ['private_market_operator', 'Private Market Operator'],
  ['government_market_operator', 'Government Market Operator'],
];

const inputClass =
  'w-full bg-transparent border border-green-900/50 focus:border-green-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-gray-600 transition-colors';

const labelClass =
  'block text-xs font-mono uppercase tracking-wider text-gray-500 mb-1';

function apiError(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  if (err?.message) return err.message;
  return 'Something went wrong. Please try again.';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function backendRequest(path, options = {}) {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('Your authentication session is unavailable.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      typeof data.detail === 'string'
        ? data.detail
        : data.detail?.message || 'Request failed.'
    );
    error.response = { data };
    throw error;
  }

  return data;
}

export default function Register() {
  const navigate = useNavigate();

  // 1 = account type/details
  // 2 = farmer/supporter details
  // 3 = email OTP
  // 4 = supporter pending / farmer complete
  const [step, setStep] = useState(1);

  const [accountType, setAccountType] = useState('farmer');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

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
    supporterType: '',
    businessName: '',
    phone: '',
  });

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError(
        'Please fill in your name, email, and a password of at least 6 characters.'
      );
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (
        accountType === 'supporter' &&
        (!form.supporterType || !form.businessName.trim())
      ) {
        throw new Error(
          'Please select your supporter type and enter your business or organization name.'
        );
      }

      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      await updateProfile(credential.user, {
        displayName: form.name.trim(),
      });

      // Preserve the existing Firestore profile.
      await setDoc(doc(db, 'users', credential.user.uid), {
        name: form.name.trim(),
        email: form.email.trim(),
        accountType,
        language: form.language,
        phone: form.phone,
        landDetails: {
          state: form.state,
          district: form.district,
          village: form.village,
          landSizeAcres: form.landSizeAcres,
          primaryCrop: form.primaryCrop,
        },
        supporterDetails:
          accountType === 'supporter'
            ? {
                supporterType: form.supporterType,
                businessName: form.businessName.trim(),
              }
            : null,
        createdAt: new Date().toISOString(),
      });

      // Create/update the real FastAPI profile.
      if (accountType === 'supporter') {
        await backendRequest('/api/users/register-supporter', {
          method: 'POST',
          body: JSON.stringify({
            supporter_type: form.supporterType,
            business_name: form.businessName.trim(),
            full_name: form.name.trim(),
            phone: form.phone.trim() || null,
          }),
        });

        await backendRequest('/api/users/me', {
          method: 'PATCH',
          body: JSON.stringify({
            state: form.state || null,
            district: form.district || null,
            village: form.village || null,
            preferred_language: form.language || null,
          }),
        });
      } else {
        await backendRequest('/api/users/me', {
          method: 'PATCH',
          body: JSON.stringify({
            full_name: form.name.trim(),
            phone: form.phone.trim() || null,
            state: form.state || null,
            district: form.district || null,
            village: form.village || null,
            preferred_language: form.language || null,
          }),
        });
      }

      // Send the real 6-digit code.
      setSendingOtp(true);

      await backendRequest('/api/auth/email/send-otp', {
        method: 'POST',
      });

      setOtpMessage(`A 6-digit verification code was sent to ${form.email.trim()}.`);
      setStep(3);
      setResendSeconds(60);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
      setSendingOtp(false);
    }
  };

  const resendOtp = async () => {
    if (resendSeconds > 0 || sendingOtp) return;

    setError('');
    setOtpMessage('');
    setSendingOtp(true);

    try {
      await backendRequest('/api/auth/email/send-otp', {
        method: 'POST',
      });

      setOtpMessage('A new verification code has been sent.');
      setResendSeconds(60);
    } catch (err) {
      const detail = err?.response?.data?.detail;

      if (detail?.retry_after) {
        setResendSeconds(Number(detail.retry_after));
      }

      setError(apiError(err));
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the complete 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);

    try {
      const result = await backendRequest('/api/auth/email/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ code: otp }),
      });

      if (accountType === 'supporter') {
        setSuccess(
          'Email verified successfully. Your supporter application is now pending administrator approval.'
        );
      } else {
        setSuccess(
          'Email verified successfully. Your AgriSaathi farmer account is active.'
        );
      }

      setStep(4);

      // Do not redirect immediately. Show the actual verification state.
      if (accountType === 'farmer') {
        setTimeout(() => navigate('/'), 1800);
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div data-auth-page="register" className="auth-page auth-register-page min-h-screen flex items-center justify-center bg-transparent px-4 py-10 relative overflow-hidden">
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

          <span className="text-gray-600">
            STEP_{step}/4
          </span>
        </div>

        <div className="bg-[#0f1512] border border-green-900/40 rounded-2xl p-6 shadow-[0_0_40px_-15px_rgba(34,197,94,0.25)]">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-1">
            Create Your Account
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            {step === 1 && 'Choose your AgriSaathi account type'}
            {step === 2 &&
              (accountType === 'supporter'
                ? 'Supporter and organization details'
                : 'Language & farm details')}
            {step === 3 && 'Verify your email address'}
            {step === 4 &&
              (accountType === 'supporter'
                ? 'Supporter application status'
                : 'Account verified')}
          </p>

          {error && (
            <div className="mb-4 bg-red-950/60 border border-red-800/60 text-red-300 text-sm rounded-lg p-3 font-mono">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-950/50 border border-green-700/50 text-green-300 text-sm rounded-lg p-3">
              {success}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Account type</label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('farmer')}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      accountType === 'farmer'
                        ? 'border-green-500 bg-green-950/40'
                        : 'border-green-900/50 hover:border-green-700'
                    }`}
                  >
                    <div className="text-slate-800 font-bold">Farmer</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Farm, crop and agricultural tools
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('supporter')}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      accountType === 'supporter'
                        ? 'border-green-500 bg-green-950/40'
                        : 'border-green-900/50 hover:border-green-700'
                    }`}
                  >
                    <div className="text-slate-800 font-bold">Supporter</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Buyer, FPO, trader, logistics, market services
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  className={inputClass}
                  required
                />
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
              {accountType === 'supporter' && (
                <>
                  <div>
                    <label className={labelClass}>
                      Supporter type
                    </label>

                    <select
                      value={form.supporterType}
                      onChange={update('supporterType')}
                      className={inputClass}
                      required
                    >
                      <option value="">Select supporter type</option>
                      {SUPPORTER_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Business / organization name
                    </label>
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={update('businessName')}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Preferred language</label>
                <select
                  value={form.language}
                  onChange={update('language')}
                  className={inputClass}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={update('state')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>District</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={update('district')}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Village / area</label>
                <input
                  type="text"
                  value={form.village}
                  onChange={update('village')}
                  className={inputClass}
                />
              </div>

              {accountType === 'farmer' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      Land size (acres)
                    </label>
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
                    <input
                      type="text"
                      value={form.primaryCrop}
                      onChange={update('primaryCrop')}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600 font-mono">
                Your email must be verified before your account becomes active.
                Supporter accounts additionally require administrator approval.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-green-900/50 text-slate-600 hover:border-green-700 font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
                >
                  {loading || sendingOtp
                    ? 'Sending code…'
                    : 'Create & Verify'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div className="rounded-lg border border-green-900/50 bg-transparent p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-gray-500">
                  Verification email
                </div>

                <div className="text-slate-800 font-medium mt-1 break-all">
                  {form.email}
                </div>
              </div>

              {otpMessage && (
                <p className="text-sm text-green-300">
                  {otpMessage}
                </p>
              )}

              <div>
                <label className={labelClass}>
                  6-digit verification code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otp.length !== 6}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
              >
                {verifyingOtp ? 'Verifying…' : 'Verify Email'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendSeconds > 0 || sendingOtp}
                  className="text-sm text-green-400 disabled:text-gray-600 hover:text-green-300"
                >
                  {resendSeconds > 0
                    ? `Resend code in ${resendSeconds}s`
                    : sendingOtp
                      ? 'Sending…'
                      : 'Resend verification code'}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-950/60 border border-green-600/50 flex items-center justify-center text-3xl">
                  ✓
                </div>

                <h2 className="text-xl font-bold text-slate-800">
                  Email Verified
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  {accountType === 'supporter'
                    ? 'Your email is verified. Your supporter application is waiting for administrator authorization.'
                    : 'Your farmer account has been successfully verified.'}
                </p>
              </div>

              {accountType === 'supporter' ? (
                <div className="rounded-xl border border-yellow-800/50 bg-yellow-950/20 p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-yellow-500">
                    ADMIN VERIFICATION
                  </div>

                  <div className="text-lg font-bold text-yellow-300 mt-2">
                    PENDING REVIEW
                  </div>

                  <p className="text-sm text-slate-500 mt-2">
                    An AgriSaathi administrator must review and authorize your
                    supporter account before trusted supporter features are enabled.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-green-800/50 bg-green-950/20 p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-green-500">
                    ACCOUNT STATUS
                  </div>

                  <div className="text-lg font-bold text-green-300 mt-2">
                    ACTIVE
                  </div>
                </div>
              )}

              {accountType === 'supporter' && (
                <Link
                  to="/login"
                  className="block text-center w-full bg-green-500 hover:bg-green-400 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm"
                >
                  Continue to Sign In
                </Link>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-green-400 font-medium hover:text-green-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
