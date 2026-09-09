import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getAuth } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getData(path) {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error('You are not signed in.');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return text ? JSON.parse(text) : [];
}

export default function AdminGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getData('/api/grievances');

        setGrievances(
          Array.isArray(result)
            ? result
            : result?.grievances || result?.items || []
        );
      } catch (error) {
        setError(error.message || 'Unable to load grievances.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="min-h-screen bg-lt-bg p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex items-center gap-3">

          <AlertTriangle className="text-lt-primary" />

          <div>
            <h1 className="text-2xl font-bold text-lt-text">
              Grievance Management
            </h1>

            <p className="text-sm text-lt-text-secondary">
              Review complaints and take administrative action
            </p>
          </div>

        </div>

        {loading && (
          <div className="rounded-xl border border-lt-border bg-lt-card p-8 text-center">
            Loading grievances...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">

            {grievances.map((item, index) => (
              <div
                key={item.id || item.grievance_id || index}
                className="rounded-xl border border-lt-border bg-lt-card p-5"
              >
                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="font-semibold text-lt-text">
                      {item.grievance_id || item.id || 'Grievance'}
                    </p>

                    <p className="mt-1 text-sm text-lt-text-secondary">
                      {item.subject ||
                        item.title ||
                        item.description ||
                        'No description'}
                    </p>

                  </div>

                  <span className="rounded-full bg-lt-bg px-3 py-1 text-xs">
                    {item.status || 'open'}
                  </span>

                </div>
              </div>
            ))}

            {grievances.length === 0 && (
              <div className="rounded-xl border border-lt-border bg-lt-card p-10 text-center text-sm text-lt-text-secondary">
                No grievances found.
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
