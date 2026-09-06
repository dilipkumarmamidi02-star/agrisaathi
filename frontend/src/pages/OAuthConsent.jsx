import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import DynamicScenePhoto from '../components/DynamicScenePhoto';

// Generic OAuth-style consent screen. AgriSaathi does not currently ship an
// OAuth authorization-server backend, so nothing here invents a token
// exchange — it only reads the real query params a redirecting client would
// send (client_id / redirect_uri / scope / state) and, on approve, forwards
// back to redirect_uri with those same real params echoed. Wire a real
// `/api/oauth/authorize` call here once that backend endpoint exists.
const SCOPE_LABELS = {
  profile: 'Your basic profile (name, location)',
  crops: 'Your crop and farm data',
  market: 'Market price lookups on your behalf',
  weather: 'Weather data for your farm location',
  livestock: 'Your livestock records',
};

export default function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const clientId = searchParams.get('client_id');
  const clientName = searchParams.get('client_name') || clientId || 'A third-party app';
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const scopes = (searchParams.get('scope') || '').split(/[\s,]+/).filter(Boolean);

  const missingParams = !clientId || !redirectUri;

  const buildRedirect = (approved) => {
    const url = new URL(redirectUri);
    url.searchParams.set('approved', String(approved));
    if (state) url.searchParams.set('state', state);
    return url.toString();
  };

  const handleApprove = () => {
    if (missingParams) return;
    window.location.href = buildRedirect(true);
  };

  const handleDeny = () => {
    if (missingParams) {
      navigate('/dashboard');
      return;
    }
    window.location.href = buildRedirect(false);
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
          AUTH_NODE / CONSENT
        </div>

        <div className="bg-[#0f1512] border border-green-900/40 rounded-2xl p-6 shadow-[0_0_40px_-15px_rgba(34,197,94,0.25)]">
          {missingParams ? (
            <>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Nothing to Approve</h1>
              <p className="text-sm text-gray-500 mb-4">
                No app is requesting access right now. This screen only activates when an external
                app redirects here with a valid <code className="text-green-400">client_id</code> and{' '}
                <code className="text-green-400">redirect_uri</code>.
              </p>
              <Link
                to="/dashboard"
                className="block text-center w-full bg-green-500 hover:bg-green-400 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
              >
                Back to Dashboard
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Authorize Access</h1>
              <p className="text-sm text-gray-500 mb-6">
                <span className="text-white font-semibold">{clientName}</span> wants to connect to your
                AgriSaathi account{user?.email ? <> (<span className="text-green-400">{user.email}</span>)</> : null}.
              </p>

              <div className="bg-[#0a0f0d] border border-green-900/40 rounded-lg p-4 mb-6">
                <p className={labelClassStandalone}>This app will be able to access:</p>
                <ul className="space-y-2 mt-2">
                  {scopes.length > 0 ? (
                    scopes.map((scope) => (
                      <li key={scope} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-0.5">✓</span>
                        {SCOPE_LABELS[scope] || scope}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 font-mono">No specific scopes were requested.</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeny}
                  className="flex-1 bg-transparent border border-green-900/50 hover:border-red-500 hover:text-red-400 text-gray-300 font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
                >
                  Deny
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-[#0a0f0d] font-bold uppercase tracking-wide py-3 rounded-lg text-sm transition-colors"
                >
                  Approve
                </button>
              </div>

              <p className="text-xs text-gray-600 font-mono mt-4 text-center">
                You can revoke access anytime from Profile Settings.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const labelClassStandalone = 'text-xs font-mono uppercase tracking-wider text-gray-500';
