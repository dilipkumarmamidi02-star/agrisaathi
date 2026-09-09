import { useState } from 'react';

const DAYS_TO_HARVEST = {
  paddy: 120, wheat: 140, cotton: 160, maize: 100, groundnut: 110,
  soybean: 100, chilli: 150, tomato: 75, onion: 110, sugarcane: 330,
};

export default function HarvestForecast() {
  const [crop, setCrop] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [result, setResult] = useState(null);

  const estimate = (e) => {
    e.preventDefault();
    const days = DAYS_TO_HARVEST[crop.trim().toLowerCase()];
    if (!days || !sowingDate) {
      setResult({ error: true });
      return;
    }
    const date = new Date(sowingDate);
    date.setDate(date.getDate() + days);
    setResult({ days, date: date.toLocaleDateString() });
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">Harvest Forecast</h1>
      <p className="text-sm text-gray-500">
        A rough general estimate based on typical days-to-harvest for common crops — actual timing
        varies by variety, weather, and local conditions.
      </p>

      <form onSubmit={estimate} className="bg-white rounded-2xl p-4 shadow border border-gray-100 space-y-3">
        <input placeholder="Crop (e.g. paddy, wheat, cotton)" value={crop} onChange={(e) => setCrop(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm">Estimate</button>
      </form>

      {result && (
        result.error ? (
          <p className="text-sm text-red-600">
            Don't have a typical-duration figure for that crop yet, or the sowing date is missing. Supported: {Object.keys(DAYS_TO_HARVEST).join(', ')}.
          </p>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
            Typical harvest window: ~{result.days} days after sowing → around <strong>{result.date}</strong>.
          </div>
        )
      )}
    </div>
  );
}
