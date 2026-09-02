import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import FloatingLeaves from '../components/FloatingLeaves';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(
        err?.code === 'auth/invalid-credential'
          ? 'Incorrect email or password.'
          : err?.message || 'Could not sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d] px-4 relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-500/10 blur-[120px]" />
      <FloatingLeaves count={10} />

      <div className="w-full max-w-sm relative">
        <div className="flex items-center gap-2 mb-6 font-mono text-xs text-green-400 tracking-widest uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          AUTH_NODE / SIGN_IN
        </div>

        <div className="bg-[#0f1512] border border-green-900/40 rounded-2xl p-6 shadow-[0_0_40px_-15px_rgba(34,197,94,0.25)]">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-1">Welcome Back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to AgriSaathi</p>

          {error && (
            <div className="mb-4 bg-red-950/60 border border-red-800/60 text-red-300 text-sm rounded-lg p-3 font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f0d] border border-green-900/50 focus:border-green-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f0d] border border-green-900/50 focus:border-green-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 transition-colors"
                required
              />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-mono text-green-500 hover:text-green-400">Forgot password?</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Signing In…' : 'Sign In ▸'}
            </button>
          </form>
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-green-400 font-medium hover:text-green-300">Create one</Link>
        </p>
      </div>
    </div>
  );
}
