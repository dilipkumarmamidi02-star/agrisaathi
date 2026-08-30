import { useEffect, useState } from 'react'
import { MapPin, Phone, ExternalLink, Stethoscope, Sprout } from 'lucide-react';

// Point this at your own backend. No vendor SDK, no API keys baked in.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SPECIALTY_FOR_DOMAIN = {
  crop: ['agronomist', 'plant_protection', 'soil_scientist'],
  animal: ['veterinarian'],
};

async function safeFetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default function NearbyHelp({ domain = 'crop', farmState = null }) {
  const [kvks, setKvks] = useState([]);
  const [experts, setExperts] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [kvkData, expertData] = await Promise.all([
        safeFetchJson(`${API_BASE}/api/kvks`),
        safeFetchJson(`${API_BASE}/api/experts`),
      ]);
      if (!cancelled) {
        setKvks(Array.isArray(kvkData) ? kvkData : []);
        setExperts(Array.isArray(expertData) ? expertData : []);
        setLoading(false);
      }
    })();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => !cancelled && setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => !cancelled && setOrigin(null),
        { timeout: 8000 }
      );
    }

    return () => { cancelled = true; };
  }, []);

  const withDist = (items) =>
    items.map((i) => ({
      ...i,
      _dist: origin && i.lat_approx != null ? haversine(origin.lat, origin.lng, i.lat_approx, i.lng_approx) : null,
    }));

  const nearestKvks = withDist(kvks)
    .sort((a, b) => (a._dist == null) - (b._dist == null) || (a._dist ?? 0) - (b._dist ?? 0))
    .slice(0, 3);

  const wantedSpecialties = SPECIALTY_FOR_DOMAIN[domain] || SPECIALTY_FOR_DOMAIN.crop;
  const matchedExperts = experts
    .filter((e) => wantedSpecialties.includes(e.specialty))
    .filter((e) => !farmState || !e.state || e.state === farmState)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-sm text-gray-500">
        Finding nearby help…
      </div>
    );
  }

  if (nearestKvks.length === 0 && matchedExperts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        No experts or KVKs on file yet for your area. Add contacts in Advisers, or check{' '}
        <a href="https://kvk.icar.gov.in/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
          the official KVK directory
        </a>.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
      <h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
        <Stethoscope className="h-4 w-4 text-blue-600" />
        Nearby help for this issue
      </h3>

      {matchedExperts.map((e, idx) => (
        <div key={e.id || idx} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-gray-100">
          <div>
            <p className="text-sm font-medium">{e.name}</p>
            <p className="text-xs text-gray-500">
              {String(e.specialty || '').replace('_', ' ')} · {e.organization || e.district || e.state || ''}
            </p>
          </div>
          {e.phone && (
            <a href={`tel:${e.phone}`} className="text-xs font-medium border border-gray-300 rounded-md px-2 py-1 flex items-center gap-1 hover:bg-gray-50">
              <Phone className="h-3.5 w-3.5" />Call
            </a>
          )}
        </div>
      ))}

      {nearestKvks.map((k, idx) => (
        <div key={k.id || idx} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-gray-100">
          <div>
            <p className="text-sm font-medium flex items-center gap-1">
              <Sprout className="h-3.5 w-3.5 text-green-600" />{k.name || `${k.district} KVK`}
            </p>
            <p className="text-xs text-gray-500">{k.district}, {k.state}</p>
            {k._dist != null && (
              <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                {k._dist.toFixed(1)} km away
              </span>
            )}
          </div>
          <a href="https://kvk.icar.gov.in/" target="_blank" rel="noopener noreferrer" className="border border-gray-300 rounded-md p-1.5 hover:bg-gray-50">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ))}

      {!origin && (
        <p className="text-[11px] text-gray-400 flex items-center gap-1">
          <MapPin className="h-3 w-3" />Enable location for distance-sorted results.
        </p>
      )}
    </div>
  );
}
