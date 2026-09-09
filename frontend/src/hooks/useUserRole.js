import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const INITIAL_STATE = {
  uid: null,
  displayName: '',
  email: '',
  role: null,
  verificationStatus: null,
  emailVerified: false,
  emailVerifiedAt: null,
  supporterType: null,
  businessName: null,
  loading: true,
  error: null,
};

async function fetchCurrentUser(firebaseUser) {
  const token = await firebaseUser.getIdToken();

  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    let detail = `Unable to load account (${response.status})`;

    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // Keep the generic error.
    }

    throw new Error(detail);
  }

  return response.json();
}

export function useUserRole() {
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!cancelled) {
          setState({
            ...INITIAL_STATE,
            loading: false,
          });
        }
        return;
      }

      if (cancelled) return;

      setState((previous) => ({
        ...previous,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName:
          firebaseUser.displayName ||
          firebaseUser.email ||
          'User',
        loading: true,
        error: null,
      }));

      try {
        const profile = await fetchCurrentUser(firebaseUser);

        if (cancelled) return;

        setState({
          uid: firebaseUser.uid,
          displayName:
            profile?.full_name ||
            firebaseUser.displayName ||
            firebaseUser.email ||
            'User',
          email: profile?.email || firebaseUser.email || '',
          role: profile?.role || null,
          verificationStatus: profile?.verification_status || null,
          emailVerified: Boolean(profile?.email_verified),
          emailVerifiedAt: profile?.email_verified_at || null,
          supporterType: profile?.supporter_type || null,
          businessName: profile?.business_name || null,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;

        setState({
          uid: firebaseUser.uid,
          displayName:
            firebaseUser.displayName ||
            firebaseUser.email ||
            'User',
          email: firebaseUser.email || '',
          role: null,
          verificationStatus: null,
          emailVerified: false,
          emailVerifiedAt: null,
          supporterType: null,
          businessName: null,
          loading: false,
          error: error?.message || 'Unable to load account status.',
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return state;
}
