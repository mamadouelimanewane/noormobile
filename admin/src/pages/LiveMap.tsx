import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL);

const carIcon = L.divIcon({
  className: 'noordrive-marker',
  html: `<div style="font-size:24px;transform:translate(-50%,-50%)">🚕</div>`,
  iconSize: [0, 0],
});

export default function LiveMap() {
  const [drivers, setDrivers] = useState<Record<string, any>>({});

  useEffect(() => {
    // Dans une app réelle, on demanderait au serveur la liste des chauffeurs en ligne
    // Ici on écoute les mises à jour pour simuler
    socket.on('driver:moved', (data) => {
      setDrivers(prev => ({ ...prev, [data.driverId]: data }));
    });
    return () => {
      socket.off('driver:moved');
    };
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold">Carte en direct</h2>
          <p className="text-gray-500 mt-1">Supervision de la flotte en temps réel</p>
        </div>
        <div className="bg-noordrive-green/10 text-noordrive-green px-4 py-2 rounded-lg font-bold">
          {Object.keys(drivers).length} Chauffeurs actifs
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative z-0">
        <MapContainer center={[14.6928, -17.4467]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap"
          />
          {Object.values(drivers).map((d: any) => (
            d.position && (
              <Marker key={d.driverId} position={[d.position.lat, d.position.lng]} icon={carIcon}>
                <Popup>
                  <div className="font-bold">Chauffeur ID: {d.driverId.slice(0,5)}</div>
                  <div className="text-xs text-gray-500">Actif maintenant</div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
