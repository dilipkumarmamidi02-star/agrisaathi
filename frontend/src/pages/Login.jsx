import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import PhotoBackdrop from '../components/PhotoBackdrop';
import '../styles/auth.css';

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
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      navigate('/', { replace: true });
    } catch (err) {
      if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/user-not-found'
      ) {
        setError('Incorrect email or password.');
      } else if (err?.code === 'auth/too-many-requests') {
        setError('Too many sign-in attempts. Please try again later.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(
          err?.message ||
          'Could not sign in. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">

        {/* LEFT AGRICULTURAL VISUAL */}
        <section className="auth-story">
          <PhotoBackdrop
            query="Indian farmer green agricultural field farming"
            overlayClassName="absolute inset-0 bg-transparent"
          />

          <div className="auth-story-content">
            <div className="auth-logo mb-5">
              <span className="text-2xl">🌱</span>
            </div>

            <h1>
              AgriSaathi
            </h1>

            <p>
              Better farming decisions start with better information.
              Access agricultural tools, market intelligence and
              trusted support from one platform.
            </p>
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section>

          <div className="flex items-center justify-between mb-3">
            <div className="auth-node">
              AUTH_NODE / LOGIN
            </div>

            <span className="auth-step">
              STEP_1/1
            </span>
          </div>

          <div className="auth-card">

            <div className="auth-logo mb-5">
              <span className="text-2xl">🌱</span>
            </div>

            <h1 className="text-3xl mb-2">
              Welcome Back
            </h1>

            <p className="text-sm mb-7">
              Sign in to continue to your AgriSaathi account.
            </p>

            {error && (
              <div className="auth-status auth-status-error mb-5">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div>
                <label className="auth-label">
                  Email
                </label>

                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="auth-label">
                  Password
                </label>

                <input
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-primary"
              >
                {loading ? 'SIGNING IN…' : 'SIGN IN'}
              </button>

            </form>

            <div className="flex items-center gap-3 my-7">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400 font-semibold">
                OR
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                New to AgriSaathi?
              </p>

              <Link
                to="/register"
                className="inline-block mt-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
              >
                Create your account →
              </Link>
            </div>

          </div>

          <div className="auth-footer">
            <span>
              Farmer & Supporter Agricultural Platform
            </span>
          </div>

        </section>

      </div>
    </main>
  );
}
