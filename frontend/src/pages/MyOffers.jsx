import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUserRole } from '../hooks/useUserRole';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

async function authConfig() {
  const { getAuth } = await import('firebase/auth');

  const user = getAuth().currentUser;

  if (!user) {
    throw new Error('Please sign in again.');
  }

  const token = await user.getIdToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export default function MyOffers() {
  const {
    uid,
    loading: userLoading,
  } = useUserRole();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!uid) {
      setOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const config = await authConfig();

      const response = await axios.get(
        `${API_URL}/api/offers/buyer`,
        config
      );

      setOffers(
        Array.isArray(response.data?.offers)
          ? response.data.offers
          : []
      );
    } catch (err) {
      console.error(
        'Failed to load sent offers:',
        err
      );

      const detail =
        err?.response?.data?.detail;

      setError(
        typeof detail === 'string'
          ? detail
          : 'Could not load your sent offers.'
      );

      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) {
      load();
    }
  }, [uid, userLoading]);

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-emerald-800">
          My Offers
        </h1>

        <p className="text-sm text-gray-500">
          Real marketplace offers you have made.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">
          Loading offers…
        </p>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl border border-green-100 bg-white p-6 text-center">
          <p className="font-medium text-gray-700">
            You haven't made any offers yet.
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Offers you submit from Lots Marketplace will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const lot = offer.lot || {};
            const farmer = offer.farmer || {};

            return (
              <div
                key={offer.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {lot.crop || 'Lot'}
                      {lot.variety
                        ? ` · ${lot.variety}`
                        : ''}
                    </p>

                    <p className="text-xs text-gray-500">
                      {lot.lot_id || offer.lot_id}
                    </p>
                  </div>

                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      offer.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : offer.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700',
                    ].join(' ')}
                  >
                    {offer.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Your offer
                    </p>

                    <p className="font-bold text-emerald-700">
                      ₹{Number(
                        offer.price_per_unit || 0
                      ).toLocaleString('en-IN')}
                      /quintal
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Quantity
                    </p>

                    <p className="font-semibold text-gray-800">
                      {offer.quantity || 0} quintal
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Farmer
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {farmer.name || 'Farmer'}
                  </p>

                  {farmer.email && (
                    <p className="text-sm text-gray-500">
                      {farmer.email}
                    </p>
                  )}

                  {farmer.phone && (
                    <p className="text-sm text-gray-500">
                      {farmer.phone}
                    </p>
                  )}

                  {(farmer.village ||
                    farmer.district ||
                    farmer.state) && (
                    <p className="text-sm text-gray-500">
                      {[
                        farmer.village,
                        farmer.district,
                        farmer.state,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                {offer.created_at && (
                  <p className="mt-4 text-xs text-gray-400">
                    Sent{' '}
                    {new Date(
                      offer.created_at
                    ).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
