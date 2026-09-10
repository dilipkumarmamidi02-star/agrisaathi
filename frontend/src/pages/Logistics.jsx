import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, MapPin, RefreshCw, Truck } from 'lucide-react';
import { call } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

function formatDistance(value) {
  if (value == null) return 'Distance unavailable';
  return `${Number(value).toFixed(1)} km`;
}

function errorMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}

export default function Logistics() {
  const {
    uid,
    displayName,
    role,
    supporterType,
    loading: userLoading,
  } = useUserRole();

  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    lot_id: '',
    offer_id: '',
    pickup_lat: '',
    pickup_lng: '',
    dropoff_lat: '',
    dropoff_lng: '',
  });

  const [quoteByRequest, setQuoteByRequest] = useState({});

  const isProvider =
    role === 'supporter' &&
    supporterType === 'logistics_provider';

  const load = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    setError('');

    try {
      if (isProvider) {
        const feed = await call('/api/logistics/requests/feed');
        setRequests(Array.isArray(feed) ? feed : []);
      } else {
        const mine = await call('/api/logistics/requests');
        setRequests(Array.isArray(mine) ? mine : []);
      }
    } catch (err) {
      setError(
        errorMessage(
          err,
          'Unable to load logistics requests.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [uid, isProvider]);

  useEffect(() => {
    if (!userLoading) load();
  }, [userLoading, load]);

  const createRequest = async (event) => {
    event.preventDefault();

    if (!form.lot_id.trim()) {
      setError('Lot ID is required.');
      return;
    }

    const values = [
      form.pickup_lat,
      form.pickup_lng,
      form.dropoff_lat,
      form.dropoff_lng,
    ];

    if (values.some((value) => value === '')) {
      setError('Pickup and drop-off coordinates are required.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const result = await call('/api/logistics/requests', {
        method: 'POST',
        data: {
          lot_id: form.lot_id.trim(),
          offer_id: form.offer_id.trim() || null,
          pickup_lat: Number(form.pickup_lat),
          pickup_lng: Number(form.pickup_lng),
          dropoff_lat: Number(form.dropoff_lat),
          dropoff_lng: Number(form.dropoff_lng),
        },
      });

      setNotice(
        `Logistics request created: ${result?.request_id || 'success'}`
      );

      setForm({
        lot_id: '',
        offer_id: '',
        pickup_lat: '',
        pickup_lng: '',
        dropoff_lat: '',
        dropoff_lng: '',
      });

      await load();
    } catch (err) {
      setError(
        errorMessage(
          err,
          'Unable to create the logistics request.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const submitQuote = async (requestId) => {
    const value = quoteByRequest[requestId];

    if (!value || Number(value) <= 0) {
      setError('Enter a valid logistics quote.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await call(
        `/api/logistics/requests/${encodeURIComponent(requestId)}/offers`,
        {
          method: 'POST',
          data: {
            cost: Number(value),
          },
        }
      );

      setQuoteByRequest((previous) => ({
        ...previous,
        [requestId]: '',
      }));

      setNotice('Your logistics quote was submitted to the farmer.');
      await load();
    } catch (err) {
      setError(
        errorMessage(
          err,
          'Unable to submit the logistics quote.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-gray-500">Loading account…</p>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="px-4 pt-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Please sign in to use Logistics.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pt-6 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800 flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Logistics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isProvider
              ? 'Find nearby farmer pickup requests and submit transport quotes.'
              : 'Create and track your real logistics requests.'}
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm"
          aria-label="Refresh logistics"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {!isProvider && role === 'farmer' && (
        <form
          onSubmit={createRequest}
          className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div>
            <h2 className="font-semibold text-gray-800">
              Create pickup request
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              This creates a real request in the AgriSaathi backend.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.lot_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, lot_id: e.target.value }))
              }
              placeholder="Lot ID"
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />

            <input
              value={form.offer_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, offer_id: e.target.value }))
              }
              placeholder="Accepted marketplace offer ID (optional)"
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pickup coordinates
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                step="any"
                value={form.pickup_lat}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    pickup_lat: e.target.value,
                  }))
                }
                placeholder="Pickup latitude"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />

              <input
                type="number"
                step="any"
                value={form.pickup_lng}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    pickup_lng: e.target.value,
                  }))
                }
                placeholder="Pickup longitude"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Drop-off coordinates
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                step="any"
                value={form.dropoff_lat}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    dropoff_lat: e.target.value,
                  }))
                }
                placeholder="Drop-off latitude"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />

              <input
                type="number"
                step="any"
                value={form.dropoff_lng}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    dropoff_lng: e.target.value,
                  }))
                }
                placeholder="Drop-off longitude"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Logistics Request
          </button>
        </form>
      )}

      {isProvider && (
        <section>
          <div className="mb-3">
            <h2 className="font-semibold text-gray-800">
              Open pickup requests
            </h2>
            <p className="text-xs text-gray-500">
              Requests are loaded from the real backend and ranked by available provider location.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
              Loading requests…
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
              <Truck className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-600">
                No open logistics requests right now.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                New farmer requests will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Lot {request.lot_id}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {formatDistance(request.distance_km)}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                      OPEN
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-gray-400">Pickup</p>
                      <p className="mt-1 font-medium text-gray-700">
                        {request.pickup?.lat}, {request.pickup?.lng}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-gray-400">Drop-off</p>
                      <p className="mt-1 font-medium text-gray-700">
                        {request.dropoff?.lat}, {request.dropoff?.lng}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quoteByRequest[request.request_id] || ''}
                      onChange={(e) =>
                        setQuoteByRequest((previous) => ({
                          ...previous,
                          [request.request_id]: e.target.value,
                        }))
                      }
                      placeholder="Quote in ₹"
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        submitQuote(request.request_id)
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {!isProvider && role === 'farmer' && (
        <section>
          <h2 className="mb-3 font-semibold text-gray-800">
            My logistics requests
          </h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-400">
              No logistics requests yet.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Lot {request.lot_id}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Request: {request.request_id}
                      </p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
                      {String(request.status || 'unknown').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
