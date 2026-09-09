import { useEffect, useState } from 'react';
import { entities } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

export default function Storage() {
  const { uid, displayName, role, loading: userLoading } = useUserRole();
  const [bookings, setBookings] = useState([]);
  const [open, setOpen] = useState([]);
  const [form, setForm] = useState({ crop: '', quantityQuintal: '', durationDays: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!uid) return;
    if (role === 'farmer') {
      setBookings(await entities.StorageBookings.filter({ farmerId: uid }, '-created_date', 100));
    } else {
      setBookings(await entities.StorageBookings.filter({ providerId: uid }, '-created_date', 100));
      setOpen(await entities.StorageBookings.filter({ status: 'requested' }, '-created_date', 100));
    }
    setLoading(false);
  };

  useEffect(() => { if (!userLoading) load(); }, [uid, role, userLoading]);

  const requestStorage = async (e) => {
    e.preventDefault();
    if (!form.crop || !form.quantityQuintal) return;
    await entities.StorageBookings.create({
      farmerId: uid,
      farmerName: displayName,
      crop: form.crop,
      quantityQuintal: Number(form.quantityQuintal),
      durationDays: Number(form.durationDays) || null,
      status: 'requested',
    });
    setForm({ crop: '', quantityQuintal: '', durationDays: '' });
    load();
  };

  const fulfill = async (booking) => {
    await entities.StorageBookings.update(booking.id, { status: 'confirmed', providerId: uid, providerName: displayName });
    load();
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">Storage</h1>
      <p className="text-sm text-gray-500">
        {role === 'farmer' ? 'Request cold storage or warehouse space for your produce.' : 'Fulfill open storage requests from farmers.'}
      </p>

      {role === 'farmer' && (
        <form onSubmit={requestStorage} className="bg-white rounded-2xl p-4 shadow border border-gray-100 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Crop" value={form.crop} onChange={(e) => setForm(f => ({ ...f, crop: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Quantity (quintal)" value={form.quantityQuintal} onChange={(e) => setForm(f => ({ ...f, quantityQuintal: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Duration (days)" value={form.durationDays} onChange={(e) => setForm(f => ({ ...f, durationDays: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm">Request Storage</button>
        </form>
      )}

      {role === 'supporter' && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Open requests</h2>
          {open.length === 0 ? <p className="text-sm text-gray-400">No open requests.</p> : open.map((b) => (
            <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{b.crop} · {b.quantityQuintal} quintal</p>
                <p className="text-sm text-gray-500">{b.farmerName}{b.durationDays ? ` · ${b.durationDays} days` : ''}</p>
              </div>
              <button onClick={() => fulfill(b)} className="text-xs font-semibold text-white bg-emerald-600 rounded-full px-4 py-1.5">Offer Storage</button>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-2">{role === 'farmer' ? 'My requests' : 'My bookings'}</h2>
        {loading ? <p className="text-sm text-gray-400">Loading…</p> : bookings.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing here yet.</p>
        ) : bookings.map((b) => (
          <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-2">
            <p className="font-semibold text-gray-800">{b.crop} · {b.quantityQuintal} quintal</p>
            <p className="text-sm text-gray-500">Status: {b.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
