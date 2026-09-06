import { useState, useEffect } from 'react';

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const cache = new Map();

export default function PhotoBackdrop({ query, overlayClassName }) {
  const [photo, setPhoto] = useState(cache.get(query) || null);

  useEffect(() => {
    let cancelled = false;

    if (cache.has(query)) {
      setPhoto(cache.get(query));
      return;
    }

    if (!PEXELS_KEY) return;

    fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: PEXELS_KEY }
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const found = data?.photos?.[0]?.src?.large2x || data?.photos?.[0]?.src?.large || null;
        cache.set(query, found);
        setPhoto(found);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {photo && (
        <img
          src={photo}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
      <div className={overlayClassName || "absolute inset-0 bg-[#0a0f0d]/80"} />
    </div>
  );
}
