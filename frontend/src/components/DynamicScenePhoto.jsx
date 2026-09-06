import { useState, useEffect } from 'react';

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const cache = new Map();

export default function DynamicScenePhoto(props) {
  const {
    query, cropName, category, type, label, title, condition, commodities, fallbackQuery,
    height = 'h-36', className = '',
  } = props;

  const resolvedQuery =
    query ||
    condition ||
    cropName ||
    category ||
    type ||
    label ||
    title ||
    (Array.isArray(commodities) && commodities[0]) ||
    fallbackQuery ||
    'indian farm field';

  const searchQuery = `${resolvedQuery} india farm`;

  const [photo, setPhoto] = useState(cache.get(searchQuery) || null);
  const [status, setStatus] = useState(cache.has(searchQuery) ? 'done' : 'loading');

  useEffect(() => {
    let cancelled = false;

    if (cache.has(searchQuery)) {
      setPhoto(cache.get(searchQuery));
      setStatus('done');
      return;
    }

    if (!PEXELS_KEY) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: PEXELS_KEY }
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const found = data?.photos?.[0]?.src?.large || null;
        cache.set(searchQuery, found);
        setPhoto(found);
        setStatus(found ? 'done' : 'error');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, [searchQuery]);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-3 ${className}`}>
      {status === 'loading' && (
        <div className="w-full h-full flex items-center justify-center text-green-700/50 text-sm">
          Loading…
        </div>
      )}
      {status === 'done' && photo && (
        <img src={photo} alt={resolvedQuery} className="w-full h-full object-cover" />
      )}
      {status === 'error' && (
        <div className="w-full h-full flex items-center justify-center text-green-700/50 text-sm">
          AgriSaathi
        </div>
      )}
    </div>
  );
}
