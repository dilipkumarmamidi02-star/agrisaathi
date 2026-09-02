import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthScene3D from '../components/AuthScene3D';

const inputClass =
  'w-full bg-[#0a0f0d] border border-green-900/50 focus:border-green-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 transition-colors';
const labelClass = 'block text-xs font-mono uppercase tracking-wider text-gray-500 mb-1';

// Firebase's password-reset emails link to /__/auth/action?mode=resetPassword&oobCode=...
// by default, which most apps redirect into their own /reset-password?oobCode=... route
// (set via the "action URL" in Firebase Console > Authentication > Templates).
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState(oobCode ? 'verifying' : 'missing-code'); // verifying | ready | invalid | missing-code | done
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!oobCode) return;
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setStatus('ready');
      })
      .catch(() => setStatus('invalid'));
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus('done');
    } catch (err) {
      setError(err?.message || 'Could not reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d] px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-500/10 blur-[120px]" />
      <AuthScene3D />

      <div className="w-full max-w-sm relative">
        <div className="flex items-center gap-2 mb-6 font-mono text-xs text-green-400 tracking-widest uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          AUTH_NODE / NEW_PASSWORD
        </div>

        <div className="bg-[#0f1512] border border-green-900/40 rounded-2xl p-6 shadow-[0_0_40px_-15px_rgba(34,197,94,0.25)]">
          {status === 'missing-code' && (
            <>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Invalid Link</h1>
              <p className="text-sm text-gray-500 mb-4">
                This page needs a reset link sent to your email. Request a new one below.
              </p>
              <Link
                to="/forgot-password"
                className="block text-center w-full bg-green-500 hover:bg-green-400 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
              >
                Request Reset Link
              </Link>
            </>
          )}

          {status === 'verifying' && (
            <div className="text-center text-sm text-gray-400 font-mono py-6">Verifying link…</div>
          )}

          {status === 'invalid' && (
            <>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Link Expired</h1>
              <p className="text-sm text-gray-500 mb-4">
                This reset link is invalid or has already been used. Request a fresh one.
              </p>
              <Link
                to="/forgot-password"
                className="block text-center w-full bg-green-500 hover:bg-green-400 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
              >
                Request Reset Link
              </Link>
            </>
          )}

          {status === 'ready' && (
            <>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-1">New Password</h1>
              <p className="text-sm text-gray-500 mb-6">
                Resetting for <span className="text-green-400">{email}</span>
              </p>

              {error && (
                <div className="mb-4 bg-red-950/60 border border-red-800/60 text-red-300 text-sm rounded-lg p-3 font-mono">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
                >
                  {loading ? 'Updating…' : 'Update Password ▸'}
                </button>
              </form>
            </>
          )}

          {status === 'done' && (
            <>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Password Updated</h1>
              <p className="text-sm text-gray-500 mb-6">You can now sign in with your new password.</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-green-500 hover:bg-green-400 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
              >
                Go to Sign In ▸
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
