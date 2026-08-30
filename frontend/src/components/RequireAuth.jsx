import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function RequireAuth() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'in' | 'out'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setStatus(user ? 'in' : 'out');
    });
    return unsubscribe;
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
        <p className="text-sm font-mono text-green-500 tracking-widest uppercase animate-pulse">
          Checking session…
        </p>
      </div>
    );
  }

  if (status === 'out') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
