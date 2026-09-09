import { useEffect, useState } from 'react';
import { Boxes } from 'lucide-react';
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

export default function AdminLots() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getData('/api/lots/');

        setLots(
          Array.isArray(result)
            ? result
            : result?.lots || result?.items || []
        );
      } catch (error) {
        setError(error.message || 'Unable to load lots.');
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

          <Boxes className="text-lt-primary" />

          <div>
            <h1 className="text-2xl font-bold text-lt-text">
              All Lots
            </h1>

            <p className="text-sm text-lt-text-secondary">
              Review and monitor lots on the platform
            </p>
          </div>

        </div>

        {loading && (
          <div className="rounded-xl border border-lt-border bg-lt-card p-8 text-center">
            Loading lots...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {lots.map((lot, index) => (
              <div
                key={lot.id || lot.lot_id || index}
                className="rounded-xl border border-lt-border bg-lt-card p-5"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>
                    <h2 className="font-semibold text-lt-text">
                      {lot.crop || 'Unknown commodity'}
                    </h2>

                    <p className="mt-1 text-xs text-lt-text-muted">
                      Lot ID: {lot.lot_id || lot.id || '—'}
                    </p>
                  </div>

                  <span className="rounded-full bg-lt-bg px-3 py-1 text-xs">
                    {lot.status || 'unknown'}
                  </span>

                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">

                  <div>
                    <p className="text-xs text-lt-text-muted">
                      Quantity
                    </p>

                    <p className="font-medium">
                      {lot.quantity_quintal ?? '—'} quintal
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-lt-text-muted">
                      Price
                    </p>

                    <p className="font-medium">
                      ₹{lot.price_per_quintal ?? '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-lt-text-muted">
                      Quality
                    </p>

                    <p className="font-medium">
                      {lot.quality_grade || 'None'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-lt-text-muted">
                      Blockchain
                    </p>

                    <p className="font-medium">
                      {lot.blockchain_status || '—'}
                    </p>
                  </div>

                </div>

                {lot.farmer_name && (
                  <p className="mt-4 border-t border-lt-border pt-3 text-xs text-lt-text-secondary">
                    Farmer: {lot.farmer_name}
                  </p>
                )}

              </div>
            ))}

            {lots.length === 0 && (
              <div className="col-span-full rounded-xl border border-lt-border bg-lt-card p-10 text-center text-sm text-lt-text-secondary">
                No lots found.
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
