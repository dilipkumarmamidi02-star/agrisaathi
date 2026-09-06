import { useState, useEffect } from 'react';

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const cache = new Map();

const CONDITION_QUERIES = {
  sunny: 'sunny farm field blue sky',
  cloudy: 'overcast farm field gray sky',
  rain: 'farm field rain',
  storm: 'farm field thunderstorm dark clouds',
  fog: 'farm field misty morning fog',
  default: 'indian farm field sunrise',
};

export default function WeatherPhotoHero({ condition }) {
  const query = CONDITION_QUERIES[condition] || CONDITION_QUERIES.default;
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
    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-100 to-green-100 mb-3">
      {status === 'loading' && (
        <div className="w-full h-full flex items-center justify-center text-green-700/50 text-sm">
          Loading…
        </div>
      )}
      {status === 'done' && photo && (
        <img src={photo} alt={condition || 'weather'} className="w-full h-full object-cover" />
      )}
      {status === 'error' && (
        <div className="w-full h-full flex items-center justify-center text-green-700/50 text-sm">
          AgriSaathi
        </div>
      )}
    </div>
  );
}
