import { useUserRole } from '../hooks/useUserRole';
import Home from './Home.jsx';
import SupporterHome from './SupporterHome.jsx';
import AdminHome from './AdminHome.jsx';

export default function RoleHome() {
  const { role, loading, error } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-mono tracking-widest uppercase animate-pulse">
          Loading account…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Unable to load account</h1>
          <p className="mt-2 text-sm opacity-70">{error}</p>
        </div>
      </div>
    );
  }

  if (role === 'admin') return <AdminHome />;
  if (role === 'supporter') return <SupporterHome />;
  if (role === 'farmer') return <Home />;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Account role unavailable</h1>
        <p className="mt-2 text-sm opacity-70">
          Please sign out and sign in again.
        </p>
      </div>
    </div>
  );
}
