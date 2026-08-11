import { useState } from 'react';
import type { ServiceRequest } from '../types';
import MapView from './MapView';
import ChatBox from './ChatBox';
import StarRating from './StarRating';
import { formatFcfa } from '../lib/geo';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

const STATUS_LABEL: Record<string, string> = {
  attribue: 'Le chauffeur arrive vers vous',
  en_cours: 'Trajet en cours',
  termine: 'Trajet terminé',
};

export default function TrackingPanel({ request, viewerRole }: { request: ServiceRequest; viewerRole: 'passager' | 'chauffeur' }) {
  const rateRequest = useStore((s) => s.rateRequest);
  const updateRideStatus = useStore((s) => s.updateRideStatus);
  const [stars, setStars] = useState(5);
  const [isPaid, setIsPaid] = useState(false);
  const alreadyRated = viewerRole === 'passager' ? request.ratingDriver : request.ratingPassenger;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="space-y-3"
      >
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{STATUS_LABEL[request.status] ?? request.status}</span>
            <span className="font-bold text-noordrive-green">{formatFcfa(request.proposedPrice)}</span>
          </div>
          <div className="text-sm text-gray-500">
            {request.pickup.label} → {request.dropoff.label}
          </div>
          
          {viewerRole === 'passager' && (request.status === 'attribue' || request.status === 'en_cours') && (
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => alert('Lien de suivi copié !')} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-semibold transition"
              >
                Partager trajet
              </button>
              <button 
                onClick={() => alert('SOS: Secours appelés et position partagée à vos contacts d\'urgence.')} 
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-xl text-sm font-semibold transition"
              >
                Bouton SOS
              </button>
            </div>
          )}
        </div>

        {viewerRole === 'chauffeur' && request.status === 'attribue' && (
          <button 
            onClick={() => updateRideStatus(request.id, 'en_cours')} 
            className="w-full bg-noordrive-black text-white font-bold py-3 rounded-xl"
          >
            Client récupéré (Démarrer la course)
          </button>
        )}

        {viewerRole === 'chauffeur' && request.status === 'en_cours' && (
          <button 
            onClick={() => updateRideStatus(request.id, 'termine')} 
            className="w-full bg-noordrive-green text-white font-bold py-3 rounded-xl"
          >
            Course terminée
          </button>
        )}

        {request.status === 'termine' && !alreadyRated && viewerRole === 'passager' && !isPaid && (
          <div className="bg-white border rounded-xl p-4 text-center space-y-4">
            <h3 className="font-bold">Régler la course</h3>
            <p className="text-xl font-black text-noordrive-green">{formatFcfa(request.proposedPrice)}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setIsPaid(true)} className="bg-[#1cc6df] text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center">
                <span>Wave</span>
              </button>
              <button onClick={() => setIsPaid(true)} className="bg-[#ff6600] text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center">
                <span>Orange Money</span>
              </button>
            </div>
            <button onClick={() => setIsPaid(true)} className="text-sm text-gray-500 underline mt-2 block w-full text-center">
              Payer en espèces
            </button>
          </div>
        )}

        {request.status === 'termine' && !alreadyRated && (viewerRole === 'chauffeur' || isPaid) && (
          <div className="bg-white border rounded-xl p-4 text-center space-y-3">
            <p className="text-sm font-medium">Notez {viewerRole === 'passager' ? 'le chauffeur' : 'le passager'}</p>
            <div className="flex justify-center">
              <StarRating value={stars} onChange={setStars} />
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => rateRequest(request.id, stars, viewerRole === 'passager' ? 'driver' : 'passenger')}
                className="bg-noordrive-black text-white px-5 py-2 rounded-full text-sm font-semibold"
              >
                Envoyer la note
              </button>
              <button
                onClick={() => rateRequest(request.id, -1, viewerRole === 'passager' ? 'driver' : 'passenger')}
                className="text-gray-400 px-3 py-2 text-sm"
              >
                Passer
              </button>
            </div>
          </div>
        )}
        {request.status === 'termine' && alreadyRated !== undefined && (
          <div className="bg-white border rounded-xl p-4 text-center text-sm text-gray-500">
            {alreadyRated > 0 ? `Merci pour votre note ★ ${alreadyRated}` : 'Trajet clôturé.'}
          </div>
        )}

        <ChatBox requestId={request.id} />
      </motion.div>
      <div className="h-72 md:h-full min-h-72">
        <MapView 
          pickup={request.pickup} 
          dropoff={request.dropoff} 
          driverPosition={request.driverPosition} 
          routeOrigin={request.status === 'attribue' && request.driverPosition ? request.driverPosition : request.pickup}
          routeDestination={request.status === 'attribue' ? request.pickup : request.dropoff}
        />
      </div>
    </div>
  );
}
