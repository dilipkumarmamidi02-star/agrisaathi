import math
from typing import Optional

EARTH_RADIUS_KM = 6371.0


def haversine_km(
    lat1: Optional[float], lng1: Optional[float],
    lat2: Optional[float], lng2: Optional[float],
) -> Optional[float]:
    if None in (lat1, lng1, lat2, lng2):
        return None
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = (math.sin(dphi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(EARTH_RADIUS_KM * c, 2)


def nearest_first(origin_lat, origin_lng, candidates, lat_attr="latitude", lng_attr="longitude"):
    scored = []
    for c in candidates:
        d = haversine_km(
            origin_lat,
            origin_lng,
            getattr(c, lat_attr, None),
            getattr(c, lng_attr, None),
        )
        if d is not None:
            scored.append((c, d))
    return sorted(scored, key=lambda pair: pair[1])
