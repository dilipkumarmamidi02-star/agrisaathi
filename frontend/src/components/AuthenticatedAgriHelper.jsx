import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import AgriHelperWidget from './AgriHelperWidget.jsx';

const HIDDEN_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/oauth-consent',
]);

function isAuthRoute(pathname) {
  const path = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  if (HIDDEN_ROUTES.has(path)) {
    return true;
  }

  return (
    path.startsWith('/login/') ||
    path.startsWith('/register/') ||
    path.startsWith('/forgot-password/') ||
    path.startsWith('/reset-password/') ||
    path.startsWith('/oauth-consent/')
  );
}

export default function AuthenticatedAgriHelper() {
  const location = useLocation();

  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return unsubscribe;
  }, []);

  /*
   * Never render the helper while Firebase auth state is
   * still being resolved.
   */
  if (user === undefined) {
    return null;
  }

  /*
   * Authentication pages never receive Agri Helper.
   */
  if (isAuthRoute(location.pathname)) {
    return null;
  }

  /*
   * No authenticated Firebase user = no helper.
   */
  if (!user) {
    return null;
  }

  return <AgriHelperWidget />;
}
