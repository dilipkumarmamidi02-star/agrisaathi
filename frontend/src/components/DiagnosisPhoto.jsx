import { useState, useEffect } from 'react';

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const cache = new Map();

export default function DiagnosisPhoto({ cropName, severity, label }) {
  const query = label || cropName || 'crop plant';
  const [photo, setPhoto] = useState(cache.get(query) || null);
  const [status, setStatus] = useState(cache.has(query) ? 'done' : 'loading');

  useEffect(() => {
    let cancelled = false;

    if (cache.has(query)) {
      setPhoto(cache.get(query));
      setStatus('done');
      return;
    }

    if (!PEXELS_KEY) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: PEXELS_KEY }
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const found = data?.photos?.[0]?.src?.large || null;
        cache.set(query, found);
        setPhoto(found);
        setStatus(found ? 'done' : 'error');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-3">
      {status === 'loading' && (
        <div className="w-full h-full flex items-center justify-center text-green-700/50 text-sm">
          Loading photo…
        </div>
      )}
      {status === 'done' && photo && (
        <img src={photo} alt={label || cropName || 'Crop'} className="w-full h-full object-cover" />
      )}
      {status === 'error' && (
        <div className="w-full h-full flex items-center justify-center text-green-700/50 text-sm">
          {cropName || 'Crop'}
        </div>
      )}
      {label && (
        <span className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          {label}
        </span>
      )}
    </div>
  );
}
