import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function RequireAuth() {
  const location = useLocation();

  const [state, setState] = useState({
    status: 'loading',
    profile: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!cancelled) {
          setState({
            status: 'out',
            profile: null,
            error: null,
          });
        }
        return;
      }

      if (cancelled) return;

      setState({
        status: 'loading',
        profile: null,
        error: null,
      });

      try {
        const token = await firebaseUser.getIdToken();

        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Account status request failed (${response.status})`);
        }

        const profile = await response.json();

        if (!cancelled) {
          setState({
            status: 'in',
            profile,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            profile: null,
            error: error?.message || 'Unable to verify account status.',
          });
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
        <p className="text-sm font-mono text-lt-primary tracking-widest uppercase animate-pulse">
          Verifying account…
        </p>
      </div>
    );
  }

  if (state.status === 'out') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d] px-6">
        <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-xl text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Unable to verify your account
          </h1>
          <p className="text-sm text-gray-600 mb-5">
            Please sign in again. If the problem continues, try again after restarting the AgriSaathi backend.
          </p>
          <button
            type="button"
            onClick={() => auth.signOut()}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  const profile = state.profile;

  /*
   * The backend's OTP verification status is authoritative.
   * This is intentionally NOT based on Firebase's emailVerified flag,
   * because AgriSaathi uses its own six-digit email OTP.
   */
  if (!profile?.email_verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d] px-6">
        <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-xl text-center">
          <div className="text-4xl mb-3">✉️</div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Email verification required
          </h1>

          <p className="text-sm text-gray-600 mb-2">
            Your AgriSaathi account was created, but your email address has
            not been verified yet.
          </p>

          <p className="text-sm text-gray-500 mb-5">
            Enter the six-digit verification code that was sent to your email
            address.
          </p>

          <button
            type="button"
            onClick={() => auth.signOut()}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
