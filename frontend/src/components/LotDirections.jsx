import { useCallback, useMemo, useState } from 'react';
import {
  ExternalLink,
  MapPin,
  Navigation,
} from 'lucide-react';

function validCoordinate(value) {
  return value !== null &&
    value !== undefined &&
    value !== '' &&
    Number.isFinite(Number(value));
}

function buildGoogleMapsDestination({ latitude, longitude, address }) {
  if (validCoordinate(latitude) && validCoordinate(longitude)) {
    return `${Number(latitude)},${Number(longitude)}`;
  }

  if (address) {
    return address;
  }

  return '';
}

export default function LotDirections({
  latitude,
  longitude,
  address,
  locationLabel = 'Farmer lot location',
  compact = false,
}) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const destination = useMemo(
    () =>
      buildGoogleMapsDestination({
        latitude,
        longitude,
        address,
      }),
    [latitude, longitude, address]
  );

  const openDestination = useCallback(() => {
    if (!destination) return;

    const url =
      `https://www.google.com/maps/search/?api=1&query=` +
      encodeURIComponent(destination);

    window.open(url, '_blank', 'noopener,noreferrer');
  }, [destination]);

  const openDirections = useCallback(() => {
    if (!destination) return;

    setLocationError('');

    const fallbackUrl =
      `https://www.google.com/maps/dir/?api=1&destination=` +
      encodeURIComponent(destination) +
      `&travelmode=driving`;

    if (!navigator.geolocation) {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin =
          `${position.coords.latitude},${position.coords.longitude}`;

        const url =
          `https://www.google.com/maps/dir/?api=1` +
          `&origin=${encodeURIComponent(origin)}` +
          `&destination=${encodeURIComponent(destination)}` +
          `&travelmode=driving`;

        setLocating(false);
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      () => {
        setLocating(false);
        setLocationError(
          'Current location was not available. Google Maps will use your location if available.'
        );
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [destination]);

  if (!destination) {
    return (
      <div className="text-xs text-gray-400">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          Location not available in farmer profile
        </span>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          {locationLabel}
        </span>

        <button
          type="button"
          onClick={openDestination}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          <MapPin className="h-3.5 w-3.5" />
          View Map
          <ExternalLink className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={openDirections}
          disabled={locating}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          <Navigation className="h-3.5 w-3.5" />
          {locating ? 'Finding you…' : 'Get Directions'}
        </button>
      </div>

      {address && (
        <p className="text-[11px] text-gray-500">
          {address}
        </p>
      )}

      {locationError && (
        <p className="text-[11px] text-amber-700">
          {locationError}
        </p>
      )}
    </div>
  );
}
