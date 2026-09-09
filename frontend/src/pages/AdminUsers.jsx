import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle, XCircle, Ban, Users } from 'lucide-react';
import { getAuth } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error('You are not signed in.');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return text ? JSON.parse(text) : null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');

      const result = await request('/api/users/admin/users');

      setUsers(
        Array.isArray(result)
          ? result
          : result?.users || result?.items || []
      );
    } catch (error) {
      setError(error.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function performAction(userId, action) {
    try {
      await request(`/api/users/admin/users/${userId}/${action}`, {
        method: 'POST',
      });

      await loadUsers();
    } catch (error) {
      alert(error.message || `Unable to ${action} user.`);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [
        user.full_name,
        user.email,
        user.phone,
        user.role,
        user.supporter_type,
        user.business_name,
        user.state,
        user.district,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [users, search]);

  return (
    <section className="min-h-screen bg-lt-bg p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex items-center gap-3">
          <Users className="text-lt-primary" />

          <div>
            <h1 className="text-2xl font-bold text-lt-text">
              User Management
            </h1>

            <p className="text-sm text-lt-text-secondary">
              Verify and manage all platform users
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-xl border border-lt-border bg-lt-card p-3">
          <Search size={18} className="text-lt-text-muted" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {loading && (
          <div className="rounded-xl border border-lt-border bg-lt-card p-8 text-center">
            Loading users...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">

            {filteredUsers.map((user) => (
              <div
                key={user.id || user.uid || user.email}
                className="rounded-xl border border-lt-border bg-lt-card p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lt-primary/10 font-semibold text-lt-primary">
                        {(user.full_name || user.email || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h2 className="font-semibold text-lt-text">
                          {user.full_name || 'Unnamed User'}
                        </h2>

                        <p className="text-sm text-lt-text-secondary">
                          {user.email || 'No email'}
                        </p>
                      </div>

                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">

                      <span className="rounded-full bg-lt-bg px-3 py-1">
                        {user.role || 'unknown'}
                      </span>

                      {user.supporter_type && (
                        <span className="rounded-full bg-lt-bg px-3 py-1">
                          {String(user.supporter_type).replaceAll('_', ' ')}
                        </span>
                      )}

                      <span className="rounded-full bg-lt-bg px-3 py-1">
                        {user.verification_status || 'unknown'}
                      </span>

                    </div>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={() => performAction(user.id, 'verify')}
                      className="inline-flex items-center gap-2 rounded-lg bg-lt-primary px-3 py-2 text-sm font-medium text-white"
                    >
                      <CheckCircle size={16} />
                      Verify
                    </button>

                    <button
                      type="button"
                      onClick={() => performAction(user.id, 'reject')}
                      className="inline-flex items-center gap-2 rounded-lg border border-lt-border px-3 py-2 text-sm"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => performAction(user.id, 'suspend')}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700"
                    >
                      <Ban size={16} />
                      Suspend
                    </button>

                  </div>

                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="rounded-xl border border-lt-border bg-lt-card p-10 text-center text-sm text-lt-text-secondary">
                No users found.
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
