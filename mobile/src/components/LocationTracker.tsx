import { useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStore } from '../store/useStore';
import { socket } from '../lib/api';

export default function LocationTracker() {
  const { position, heading } = useGeolocation();
  const currentUser = useStore(s => s.currentUser);
  // Assuming driver is online if they are in the active drivers list (we can check currentUser status)

  useEffect(() => {
    if (currentUser?.role === 'chauffeur' && position) {
      if (socket) {
        socket.emit('driver:location', {
          driverId: currentUser.id,
          position: { ...position, heading: heading || 0 }
        });
      }
    }
  }, [position, heading, currentUser]);

  return null;
}
