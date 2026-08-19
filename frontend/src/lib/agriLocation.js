/*
 * Stable location handling.
 *
 * GPS is treated as a suggestion only.
 * It must NEVER silently replace a user-selected
 * State / District.
 */

export function getBrowserLocation() {
  return new Promise((resolve) => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
          accuracy:
            position.coords.accuracy,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 8000,
      }
    );
  });
}

/*
 * Important:
 *
 * This does NOT claim that GPS coordinates are a
 * Data.gov State/District match.
 *
 * The UI should show:
 *
 * "Location detected"
 *
 * and let the user select the actual Data.gov
 * State/District.
 */
export function formatDetectedLocation(location) {
  if (!location) {
    return '';
  }

  const lat =
    Number(location.latitude);

  const lon =
    Number(location.longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return '';
  }

  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
