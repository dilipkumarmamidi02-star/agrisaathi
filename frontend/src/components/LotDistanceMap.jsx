import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

export default function LotDistanceMap({
  lotPoint,
  userPoint,
  distanceKm,
  lotLabel = "Lot",
  userLabel = "You"
}) {
  if (!lotPoint || !userPoint) {
    return null;
  }

  const center = [
    (lotPoint.lat + userPoint.lat) / 2,
    (lotPoint.lng + userPoint.lng) / 2
  ];

  return (
    <div>
      <MapContainer
        center={center}
        zoom={9}
        style={{
          height: "320px",
          width: "100%"
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            lotPoint.lat,
            lotPoint.lng
          ]}
        >
          <Popup>
            {lotLabel}
          </Popup>
        </Marker>

        <Marker
          position={[
            userPoint.lat,
            userPoint.lng
          ]}
        >
          <Popup>
            {userLabel}
          </Popup>
        </Marker>

        <Polyline
          positions={[
            [
              lotPoint.lat,
              lotPoint.lng
            ],
            [
              userPoint.lat,
              userPoint.lng
            ]
          ]}
        />
      </MapContainer>

      {distanceKm != null && (
        <p className="text-sm mt-1">
          Distance: {distanceKm} km
        </p>
      )}
    </div>
  );
}
