import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useUserRole } from '../hooks/useUserRole';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getOrders() {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error('You are not signed in.');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed: ${response.status}`);
  }

  const data = text ? JSON.parse(text) : {};

  return Array.isArray(data)
    ? data
    : data?.orders || data?.items || [];
}

export default function Orders() {
  const { uid, role, loading: userLoading } = useUserRole();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userLoading || !uid) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await getOrders();

        if (!cancelled) {
          setOrders(result);
        }
      } catch (err) {
        if (!cancelled) {
          setOrders([]);
          setError(
            err?.message ||
            'Unable to load your orders.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [uid, userLoading]);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">
        Orders
      </h1>

      <p className="text-sm text-gray-500">
        Confirmed deals from accepted offers.
      </p>

      {loading && (
        <p className="text-sm text-gray-400">
          Loading…
        </p>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-gray-400">
          No orders yet.
        </p>
      )}

      {!loading && !error && orders.map((order) => (
        <div
          key={order.id || order.order_id}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <p className="font-semibold text-gray-800">
            {order.commodity || 'Commodity'}
            {order.lot_id ? ` · ${order.lot_id}` : ''}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Order: {order.order_id || order.id}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            ₹{Number(order.gross_amount || 0).toLocaleString('en-IN')}
            {' · '}
            {Number(order.quantity || 0).toLocaleString('en-IN')} quintal
          </p>

          <p className="text-sm text-gray-500 mt-1">
            {role === 'farmer'
              ? `Buyer ID: ${order.buyer_id || '—'}`
              : `Farmer ID: ${order.farmer_id || '—'}`}
            {' · '}
            {order.status || 'confirmed'}
          </p>

          {order.created_at && (
            <p className="text-xs text-gray-400 mt-2">
              Created{' '}
              {new Date(order.created_at).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
