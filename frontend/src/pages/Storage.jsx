import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Warehouse,
} from 'lucide-react';
import { call } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

const STORAGE_TYPES = {
  cold_storage_provider: 'Cold Storage',
  warehouse_provider: 'Warehouse',
};

function errorMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}

export default function Storage() {
  const {
    uid,
    role,
    supporterType,
    loading: userLoading,
  } = useUserRole();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [quoteByRequest, setQuoteByRequest] = useState({});

  const [form, setForm] = useState({
    lot_id: '',
    facility_type: 'warehouse_provider',
    lot_lat: '',
    lot_lng: '',
  });

  const isProvider =
    role === 'supporter' &&
    (
      supporterType === 'cold_storage_provider' ||
      supporterType === 'warehouse_provider'
    );

  const load = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    setError('');

    try {
      if (isProvider) {
        const feed = await call('/api/storage/requests/feed');
        setRequests(Array.isArray(feed) ? feed : []);
      } else {
        const mine = await call('/api/storage/requests');
        setRequests(Array.isArray(mine) ? mine : []);
      }
    } catch (err) {
      setError(
        errorMessage(
          err,
          'Unable to load storage requests.'
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

    if (form.lot_lat === '' || form.lot_lng === '') {
      setError('Lot latitude and longitude are required.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const result = await call('/api/storage/requests', {
        method: 'POST',
        data: {
          lot_id: form.lot_id.trim(),
          facility_type: form.facility_type,
          lot_lat: Number(form.lot_lat),
          lot_lng: Number(form.lot_lng),
        },
      });

      setNotice(
        `Storage request created: ${result?.request_id || 'success'}`
      );

      setForm({
        lot_id: '',
        facility_type: 'warehouse_provider',
        lot_lat: '',
        lot_lng: '',
      });

      await load();
    } catch (err) {
      setError(
        errorMessage(
          err,
          'Unable to create the storage request.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const submitQuote = async (requestId) => {
    const value = quoteByRequest[requestId];

    if (!value || Number(value) <= 0) {
      setError('Enter a valid storage quote.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await call(
        `/api/storage/requests/${encodeURIComponent(requestId)}/offers`,
        {
          method: 'POST',
          data: {
            cost: Number(value),
            facility_id: null,
          },
        }
      );

      setQuoteByRequest((previous) => ({
        ...previous,
        [requestId]: '',
      }));

      setNotice('Your storage quote was submitted to the farmer.');
      await load();
    } catch (err) {
      setError(
        errorMessage(
          err,
          'Unable to submit the storage quote.'
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
          Please sign in to use Storage.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pt-6 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-emerald-800">
            <Warehouse className="h-6 w-6" />
            Storage
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isProvider
              ? `${STORAGE_TYPES[supporterType]} requests from farmers.`
              : 'Request real cold-storage or warehouse capacity for your produce.'}
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm"
          aria-label="Refresh storage"
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
              Request storage
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Your request is stored in the AgriSaathi backend and becomes visible to matching verified providers.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.lot_id}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  lot_id: e.target.value,
                }))
              }
              placeholder="Lot ID"
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />

            <select
              value={form.facility_type}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  facility_type: e.target.value,
                }))
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="warehouse_provider">
                Warehouse
              </option>
              <option value="cold_storage_provider">
                Cold Storage
              </option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              step="any"
              value={form.lot_lat}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  lot_lat: e.target.value,
                }))
              }
              placeholder="Lot latitude"
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />

            <input
              type="number"
              step="any"
              value={form.lot_lng}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  lot_lng: e.target.value,
                }))
              }
              placeholder="Lot longitude"
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>

          <button
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Create Storage Request
          </button>
        </form>
      )}

      {isProvider && (
        <section>
          <div className="mb-3">
            <h2 className="font-semibold text-gray-800">
              Open storage requests
            </h2>

            <p className="text-xs text-gray-500">
              Only requests matching your registered provider type are returned by the backend.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
              Loading requests…
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
              <Warehouse className="mx-auto h-8 w-8 text-gray-300" />

              <p className="mt-2 text-sm font-medium text-gray-600">
                No open storage requests right now.
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Matching farmer requests will appear here.
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

                      <p className="mt-1 text-xs text-gray-500">
                        {STORAGE_TYPES[supporterType] || 'Storage'}
                        {' · '}
                        {request.distance_km != null
                          ? `${Number(request.distance_km).toFixed(1)} km`
                          : 'Distance unavailable'}
                      </p>
                    </div>

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                      OPEN
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs">
                    <p className="text-gray-400">
                      Produce location
                    </p>

                    <p className="mt-1 font-medium text-gray-700">
                      {request.lot_location?.lat},{' '}
                      {request.lot_location?.lng}
                    </p>
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
                      placeholder="Storage quote in ₹"
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
            My storage requests
          </h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-400">
              No storage requests yet.
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
                        {STORAGE_TYPES[request.facility_type] ||
                          request.facility_type}
                      </p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
                      {String(
                        request.status || 'unknown'
                      ).toUpperCase()}
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
