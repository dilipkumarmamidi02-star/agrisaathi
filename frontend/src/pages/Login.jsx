import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import PhotoBackdrop from '../components/PhotoBackdrop';

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <PhotoBackdrop
        query="farmer ploughing field with oxen"
        overlayClassName="absolute inset-0 bg-white/70"
      />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-3 shadow-sm">
            <span className="text-white text-2xl">🌱</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AgriSaathi</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to continue to AgriSaathi</p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 transition-colors"
                required
              />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Forgot password?</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition-colors shadow-sm"
            >
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-sm text-gray-700 text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-emerald-700 font-semibold hover:text-emerald-800">Create one</Link>
        </p>
      </div>
    </div>
  );
}
