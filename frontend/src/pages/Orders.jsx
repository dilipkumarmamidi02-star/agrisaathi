import { useEffect, useState } from 'react';
import { entities } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

export default function Orders() {
  const { uid, role, loading: userLoading } = useUserRole();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !uid) return;
    const filter = role === 'farmer' ? { farmerId: uid } : { vendorId: uid };
    entities.Orders.filter(filter, '-created_date', 200).then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, [uid, role, userLoading]);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">Orders</h1>
      <p className="text-sm text-gray-500">Confirmed deals from accepted offers.</p>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : orders.length === 0 ? (
        <p className="text-sm text-gray-400">No orders yet.</p>
      ) : orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-800">{order.lotSummary}</p>
          <p className="text-sm text-gray-500">
            ₹{order.pricePerQuintal}/quintal · {role === 'farmer' ? `Buyer: ${order.vendorName}` : `Seller: ${order.farmerName}`} · {order.status}
          </p>
        </div>
      ))}
    </div>
  );
}
