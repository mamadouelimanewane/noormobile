import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { GeoPoint } from '../types';

const dotIcon = (color: string, label?: string) =>
  L.divIcon({
    className: 'noordrive-marker',
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>${
      label ? `<div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;font-weight:600;background:white;padding:1px 6px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.25)">${label}</div>` : ''
    }`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const carIcon = (_color: string, heading?: number) =>
  L.divIcon({
    className: 'noordrive-marker',
    html: `<div style="font-size:24px;line-height:24px;text-align:center;transform:rotate(${heading || 0}deg)">🚗</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

interface MapViewProps {
  pickup?: GeoPoint;
  dropoff?: GeoPoint;
  driverPosition?: GeoPoint;
  nearbyCars?: GeoPoint[];
  center?: GeoPoint;
  height?: string;
  extraMarkers?: { point: GeoPoint; color: string; label: string }[];
  onMapClick?: (point: GeoPoint) => void;
  routeOrigin?: GeoPoint;
  routeDestination?: GeoPoint;
}

function MapEvents({ onClick }: { onClick: (p: GeoPoint) => void }) {
  useMapEvents({
    click: async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      try {
        const res = await fetch(`https://us1.locationiq.com/v1/reverse?key=pk.ef8f3d80db02a286ae4b6fae736af632&lat=${lat}&lon=${lng}&format=json`);
        if (res.ok) {
          const data = await res.json();
          const label = data.address?.road || data.address?.suburb || data.address?.village || data.address?.city || 'Position sélectionnée';
          onClick({ lat, lng, label });
        } else {
          onClick({ lat, lng, label: 'Position sélectionnée' });
        }
      } catch {
        onClick({ lat, lng, label: 'Position sélectionnée' });
      }
    }
  });
  return null;
}

export default function MapView({ pickup, dropoff, driverPosition, nearbyCars, center, height = '100%', extraMarkers, onMapClick, routeOrigin, routeDestination }: MapViewProps) {
  const mapCenter = center ?? pickup ?? { lat: 14.7167, lng: -17.4677, label: 'Dakar' };
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  const origin = routeOrigin || pickup;
  const dest = routeDestination || dropoff;

  useEffect(() => {
    if (!origin || !dest) {
      setRouteCoords(null);
      return;
    }
    async function fetchRoute() {
      try {
        const res = await fetch(`https://us1.locationiq.com/v1/directions/driving/${origin!.lng},${origin!.lat};${dest!.lng},${dest!.lat}?key=pk.ef8f3d80db02a286ae4b6fae736af632&geometries=geojson`);
        if (res.ok) {
          const data = await res.json();
          if (data.routes?.[0]?.geometry?.coordinates) {
            const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            setRouteCoords(coords);
            return;
          }
        }
        setRouteCoords(null);
      } catch {
        setRouteCoords(null);
      }
    }
    fetchRoute();
  }, [origin?.lat, origin?.lng, dest?.lat, dest?.lng]);

  return (
    <div style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://locationiq.com/?ref=maps">LocationIQ</a> contributors'
          url="https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=pk.ef8f3d80db02a286ae4b6fae736af632"
        />
        {onMapClick && <MapEvents onClick={onMapClick} />}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={dotIcon('#0a8f4c', pickup.label)}>
            <Popup>Départ : {pickup.label}</Popup>
          </Marker>
        )}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dotIcon('#e33', dropoff.label)}>
            <Popup>Arrivée : {dropoff.label}</Popup>
          </Marker>
        )}
        {(origin && dest) && (
          <Polyline
            positions={routeCoords || [
              [origin.lat, origin.lng],
              [dest.lat, dest.lng],
            ]}
            pathOptions={{ color: '#0a8f4c', dashArray: routeCoords ? undefined : '6 8', weight: routeCoords ? 4 : 2 }}
          />
        )}
        {driverPosition && (
          <Marker position={[driverPosition.lat, driverPosition.lng]} icon={carIcon('#000', driverPosition.heading)}>
            <Popup>Votre chauffeur</Popup>
          </Marker>
        )}
        {nearbyCars?.map((c, i) => (
          <Marker key={`nc-${i}`} position={[c.lat, c.lng]} icon={carIcon('#1cc6f4', c.heading)} />
        ))}
        {extraMarkers?.map((m, i) => (
          <Marker key={i} position={[m.point.lat, m.point.lng]} icon={dotIcon(m.color, m.label)} />
        ))}
      </MapContainer>
    </div>
  );
}
