import { useEffect, useState } from 'react';
import { entities } from '../api/appClient';

export default function DemandMap() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    entities.Lots.filter({ status: 'active' }, '-created_date', 500).then((lots) => {
      const byCrop = {};
      lots.forEach((l) => {
        byCrop[l.crop] = byCrop[l.crop] || { crop: l.crop, totalQuintal: 0, prices: [] };
        byCrop[l.crop].totalQuintal += Number(l.quantityQuintal) || 0;
        byCrop[l.crop].prices.push(Number(l.pricePerQuintal) || 0);
      });
      const list = Object.values(byCrop).map((c) => ({
        ...c,
        avgPrice: Math.round(c.prices.reduce((a, b) => a + b, 0) / c.prices.length),
      })).sort((a, b) => b.totalQuintal - a.totalQuintal);
      setRows(list);
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">Demand Overview</h1>
      <p className="text-sm text-gray-500">
        Active supply by crop across AgriSaathi right now — a supply summary, not a live geographic map.
      </p>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : rows.length === 0 ? (
        <p className="text-sm text-gray-400">No active lots to summarize yet.</p>
      ) : rows.map((r, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800">{r.crop}</p>
          <p className="text-sm text-gray-500">{r.totalQuintal} quintal total · avg ₹{r.avgPrice}/quintal</p>
        </div>
      ))}
    </div>
  );
}
