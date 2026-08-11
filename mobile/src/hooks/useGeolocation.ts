import { useState, useEffect } from 'react';
import type { GeoPoint } from '../types';

interface LocationState {
  position: GeoPoint | null;
  heading: number | null;
  speed: number | null; // meters per second
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<LocationState>({
    position: null,
    heading: null,
    speed: null,
    error: null,
  });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: "La géolocalisation n'est pas supportée par votre navigateur" }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        setState({
          position: { lat: latitude, lng: longitude, label: 'Ma position' },
          heading,
          speed,
          error: null,
        });
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
