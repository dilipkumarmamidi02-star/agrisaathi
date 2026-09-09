import { useEffect, useState } from 'react';
import { entities } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

export default function Offers() {
  const { uid, displayName, loading: userLoading } = useUserRole();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!uid) return;
    const myLots = await entities.Lots.filter({ farmerId: uid });
    const lotIds = new Set(myLots.map((l) => l.id));
    const allOffers = await entities.Offers.list('-created_date', 200);
    setOffers(allOffers.filter((o) => lotIds.has(o.lotId)));
    setLoading(false);
  };

  useEffect(() => { if (!userLoading) load(); }, [uid, userLoading]);

  const respond = async (offer, status) => {
    await entities.Offers.update(offer.id, { status });
    if (status === 'accepted') {
      await entities.Lots.update(offer.lotId, { status: 'sold' });
      await entities.Orders.create({
        lotId: offer.lotId,
        lotSummary: offer.lotSummary,
        farmerId: uid,
        farmerName: displayName,
        vendorId: offer.vendorId,
        vendorName: offer.vendorName,
        pricePerQuintal: offer.offerPricePerQuintal,
        status: 'confirmed',
      });
    }
    load();
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">Offers</h1>
      <p className="text-sm text-gray-500">Offers vendors have made on your lots.</p>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : offers.length === 0 ? (
        <p className="text-sm text-gray-400">No offers yet.</p>
      ) : offers.map((offer) => (
        <div key={offer.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">{offer.lotSummary}</p>
            <p className="text-sm text-gray-500">₹{offer.offerPricePerQuintal}/quintal from {offer.vendorName} · {offer.status}</p>
          </div>
          {offer.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => respond(offer, 'accepted')} className="text-xs font-semibold text-white bg-emerald-600 rounded-full px-3 py-1">Accept</button>
              <button onClick={() => respond(offer, 'rejected')} className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-full px-3 py-1">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
