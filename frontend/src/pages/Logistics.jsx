import { useEffect, useState } from 'react';
import { entities } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

export default function Logistics() {
  const { uid, displayName, role, loading: userLoading } = useUserRole();
  const [mine, setMine] = useState([]);
  const [open, setOpen] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!uid) return;
    if (role === 'farmer') {
      setMine(await entities.LogisticsTrips.filter({ requestedBy: uid }, '-created_date', 100));
    } else {
      setMine(await entities.LogisticsTrips.filter({ assignedTo: uid }, '-created_date', 100));
      setOpen(await entities.LogisticsTrips.filter({ status: 'open' }, '-created_date', 100));
    }
    setLoading(false);
  };

  useEffect(() => { if (!userLoading) load(); }, [uid, role, userLoading]);

  const claim = async (trip) => {
    await entities.LogisticsTrips.update(trip.id, { status: 'assigned', assignedTo: uid, assignedToName: displayName });
    load();
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">Logistics</h1>
      <p className="text-sm text-gray-500">
        {role === 'farmer' ? "Pickup requests you've made." : 'Claim open pickup requests, manage your trips.'}
      </p>

      {role === 'supporter' && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Open requests</h2>
          {open.length === 0 ? <p className="text-sm text-gray-400">No open requests.</p> : open.map((t) => (
            <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{t.cropType} · {t.quantityQuintal} quintal</p>
                <p className="text-sm text-gray-500">Requested by {t.requestedByName}</p>
              </div>
              <button onClick={() => claim(t)} className="text-xs font-semibold text-white bg-emerald-600 rounded-full px-4 py-1.5">Claim</button>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-2">{role === 'farmer' ? 'My requests' : 'My trips'}</h2>
        {loading ? <p className="text-sm text-gray-400">Loading…</p> : mine.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing here yet.</p>
        ) : mine.map((t) => (
          <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-2">
            <p className="font-semibold text-gray-800">{t.cropType} · {t.quantityQuintal} quintal</p>
            <p className="text-sm text-gray-500">Status: {t.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
