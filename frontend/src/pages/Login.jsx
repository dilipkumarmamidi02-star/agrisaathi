import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import heroImage from '../assets/hero.png';

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

  const ensureProfileDoc = async (user, extra = {}) => {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        name: user.displayName || extra.name || '',
        email: user.email || null,
        createdAt: new Date().toISOString(),
        ...extra,
      },
      { merge: true }
    );
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      await ensureProfileDoc(credential.user);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Could not sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const credential = await signInAnonymously(auth);
      await ensureProfileDoc(credential.user, { name: 'Guest' });
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Could not continue as guest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 bg-ink overflow-hidden">
      {/* Real farm photo background, with a dark readability overlay so
          text never fights the image for contrast (WCAG-AA target). */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />

      <div className="relative w-full max-w-sm">
        <div className="text-2xl font-display font-bold mb-8">
          <span className="text-accent">Agri</span>
          <span className="text-mint">Saathi</span>
        </div>

        <div className="bg-surface/80 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl">
          <span className="inline-block text-eyebrow bg-mint/10 text-mint border border-mint/30 rounded-full px-3 py-1 mb-4">
            AgriSaathi Intelligence
          </span>

          <h1 className="text-3xl font-display font-bold text-text-primary mb-1">
            Welcome Back
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Sign in to your farming command center
          </p>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-text-secondary mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-ink/60 border border-border-strong rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-wide text-text-secondary">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-mint hover:text-accent transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink/60 border border-border-strong rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mint hover:bg-mint/90 disabled:opacity-60 text-ink font-display font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? 'Signing in…' : (<>Sign In <span aria-hidden>→</span></>)}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-mono text-text-muted">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border border-border-strong hover:border-accent hover:bg-surface-hover disabled:opacity-60 text-text-primary font-medium py-2.5 rounded-lg text-sm mb-2 transition-colors"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleAnonymousSignIn}
            disabled={loading}
            className="w-full border border-border-strong hover:border-accent hover:bg-surface-hover disabled:opacity-60 text-text-primary font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Continue as guest
          </button>

          <p className="text-sm text-text-secondary text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-accent font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
