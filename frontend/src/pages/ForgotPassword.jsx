import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import DynamicScenePhoto from '../components/DynamicScenePhoto';

const inputClass =
  'w-full bg-[#0a0f0d] border border-green-900/50 focus:border-green-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 transition-colors';
const labelClass = 'block text-xs font-mono uppercase tracking-wider text-gray-500 mb-1';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(
        err?.code === 'auth/user-not-found'
          ? 'No account found with that email.'
          : err?.code === 'auth/invalid-email'
          ? 'Enter a valid email address.'
          : err?.message || 'Could not send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d] px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-500/10 blur-[120px]" />
      <DynamicScenePhoto fallbackQuery="farmer ploughing field with oxen" />

      <div className="w-full max-w-sm relative">
        <div className="flex items-center gap-2 mb-6 font-mono text-xs text-green-400 tracking-widest uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          AUTH_NODE / RECOVER
        </div>

        <div className="bg-[#0f1512] border border-green-900/40 rounded-2xl p-6 shadow-[0_0_40px_-15px_rgba(34,197,94,0.25)]">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-1">Reset Password</h1>
          <p className="text-sm text-gray-500 mb-6">
            {sent
              ? "We've sent a reset link to your inbox."
              : "Enter your account email and we'll send you a reset link."}
          </p>

          {error && (
            <div className="mb-4 bg-red-950/60 border border-red-800/60 text-red-300 text-sm rounded-lg p-3 font-mono">
              {error}
            </div>
          )}

          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-950/40 border border-green-800/50 text-green-300 text-sm rounded-lg p-3 font-mono">
                Reset email sent to <span className="text-white">{email}</span>. Check your inbox
                (and spam folder) for the link.
              </div>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError('');
                }}
                className="w-full bg-transparent border border-green-900/50 hover:border-green-500 text-gray-300 font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
              >
                Send Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Sending…' : 'Send Reset Link ▸'}
              </button>
            </form>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-green-400 font-medium hover:text-green-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
