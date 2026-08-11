import type { GeoPoint } from '../types';

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function suggestedPrice(pickup: GeoPoint, dropoff: GeoPoint): number {
  const km = Math.max(distanceKm(pickup, dropoff), 0.8);
  const price = 400 + km * 220;
  return Math.round(price / 50) * 50;
}

export function moveToward(from: GeoPoint, to: GeoPoint, fraction: number): GeoPoint {
  return {
    lat: from.lat + (to.lat - from.lat) * fraction,
    lng: from.lng + (to.lng - from.lng) * fraction,
    label: to.label,
  };
}

export function isClose(a: GeoPoint, b: GeoPoint, thresholdKm = 0.05): boolean {
  return distanceKm(a, b) < thresholdKm;
}

export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}
