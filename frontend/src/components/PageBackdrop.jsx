import { useState, useEffect } from 'react';

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const cache = new Map();

export default function PageBackdrop({ query, children }) {
  const searchQuery = `${query} india farm`;
  const [photo, setPhoto] = useState(cache.get(searchQuery) || null);

  useEffect(() => {
    let cancelled = false;

    if (cache.has(searchQuery)) {
      setPhoto(cache.get(searchQuery));
      return;
    }
    if (!PEXELS_KEY) return;

    fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: PEXELS_KEY }
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const found = data?.photos?.[0]?.src?.large2x || data?.photos?.[0]?.src?.large || null;
        cache.set(searchQuery, found);
        setPhoto(found);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [searchQuery]);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-white/80" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
