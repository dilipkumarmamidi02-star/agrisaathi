import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getOrders() {
  const user = getAuth().currentUser;
  if (!user) throw new Error('You are not signed in.');
  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Request failed: ${response.status}`);
  const data = text ? JSON.parse(text) : {};
  return Array.isArray(data) ? data : data?.orders || data?.items || [];
}

export default function TrustRankings() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then((orders) => {
      const byFarmer = {};
      orders.forEach((o) => {
        if (!o.farmerId) return;
        byFarmer[o.farmerId] = byFarmer[o.farmerId] || { name: o.farmerName || 'Farmer', count: 0 };
        byFarmer[o.farmerId].count += 1;
      });
      setRankings(Object.values(byFarmer).sort((a, b) => b.count - a.count));
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">Trust Rankings</h1>
      <p className="text-sm text-gray-500">
        Ranked by number of completed orders on AgriSaathi — not a third-party credit or verification score.
      </p>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : rankings.length === 0 ? (
        <p className="text-sm text-gray-400">No completed orders yet.</p>
      ) : rankings.map((r, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800">{i + 1}. {r.name}</p>
          <p className="text-sm text-gray-500">{r.count} completed order{r.count === 1 ? '' : 's'}</p>
        </div>
      ))}
    </div>
  );
}
