import { useEffect, useState } from 'react';
import { entities } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

export default function MyOffers() {
  const { uid, loading: userLoading } = useUserRole();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !uid) return;
    entities.Offers.filter({ vendorId: uid }, '-created_date', 200).then((o) => {
      setOffers(o);
      setLoading(false);
    });
  }, [uid, userLoading]);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">My Offers</h1>
      <p className="text-sm text-gray-500">Offers you've made on farmer lots.</p>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : offers.length === 0 ? (
        <p className="text-sm text-gray-400">You haven't made any offers yet.</p>
      ) : offers.map((offer) => (
        <div key={offer.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-800">{offer.lotSummary}</p>
          <p className="text-sm text-gray-500">₹{offer.offerPricePerQuintal}/quintal · {offer.status}</p>
        </div>
      ))}
    </div>
  );
}
