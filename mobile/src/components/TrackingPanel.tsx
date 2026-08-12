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

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  attribue: 'Le livreur est en route',
  en_cours: 'Colis en transit',
  termine: 'Colis livré',
};

const INTERCITY_STATUS_LABEL: Record<string, string> = {
  attribue: 'En route vers le point de rendez-vous',
  en_cours: 'Trajet interurbain en cours',
  termine: 'Arrivé à destination',
};

export default function TrackingPanel({ request, viewerRole, hideMap }: { request: ServiceRequest; viewerRole: 'passager' | 'chauffeur', hideMap?: boolean }) {
  const rateRequest = useStore((s) => s.rateRequest);
  const updateRideStatus = useStore((s) => s.updateRideStatus);
  const cancelRequest = useStore((s) => s.cancelRequest);
  const [stars, setStars] = useState(5);
  const [isPaid, setIsPaid] = useState(false);
  const alreadyRated = viewerRole === 'passager' ? request.ratingDriver : request.ratingPassenger;

  return (
    <div className={hideMap ? "" : "grid md:grid-cols-2 gap-4"}>
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="space-y-3"
      >
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">
              {request.type === 'delivery'
                ? DELIVERY_STATUS_LABEL[request.status] ?? request.status
                : request.type === 'intercity'
                ? INTERCITY_STATUS_LABEL[request.status] ?? request.status
                : STATUS_LABEL[request.status] ?? request.status}
            </span>
            <span className="font-bold text-noordrive-green">{formatFcfa(request.proposedPrice)}</span>
          </div>
          <div className="text-sm text-gray-500">
            {request.pickup?.label || 'Départ inconnu'} → {request.dropoff?.label || 'Arrivée inconnue'}
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
            {request.type === 'delivery' ? 'Colis récupéré (En route)' : 'Client récupéré (Démarrer la course)'}
          </button>
        )}

        {request.status === 'attribue' && (
          <button 
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment annuler cette course ?')) {
                cancelRequest(request.id);
              }
            }} 
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition border border-red-100"
          >
            {request.type === 'delivery' ? 'Annuler la livraison' : 'Annuler la course'}
          </button>
        )}

        {request.type === 'delivery' && request.packageInfo && (viewerRole === 'chauffeur' || viewerRole === 'passager') && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-blue-900">Détails de la Livraison</h4>
            <p className="text-blue-800 text-sm">Destinataire : <span className="font-semibold">{request.packageInfo.destinataireNom}</span></p>
            <div className="flex items-center justify-between">
              <p className="text-blue-800 font-medium text-sm">{request.packageInfo.destinatairePhone}</p>
              {viewerRole === 'chauffeur' && (
                <a href={`tel:${request.packageInfo.destinatairePhone}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm">
                  Appeler
                </a>
              )}
            </div>
            <div className="mt-2 text-xs text-blue-600 border-t border-blue-200 pt-2 font-medium">
              Colis {request.packageInfo.taille} : {request.packageInfo.description}
            </div>
          </div>
        )}

        {request.type === 'intercity' && request.intercityInfo && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-purple-900">Covoiturage {request.intercityInfo.villeDepart} → {request.intercityInfo.villeArrivee}</h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-purple-800 text-sm font-medium">Date de départ</span>
              <span className="text-purple-900 font-bold">{request.intercityInfo.dateDepart}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-800 text-sm font-medium">Places réservées</span>
              <span className="text-purple-900 font-bold">{request.intercityInfo.places}</span>
            </div>
          </div>
        )}

        {viewerRole === 'chauffeur' && request.status === 'en_cours' && (
          <button 
            onClick={() => updateRideStatus(request.id, 'termine')} 
            className="w-full bg-noordrive-green text-white font-bold py-3 rounded-xl"
          >
            {request.type === 'delivery' ? 'Colis livré (Terminer)' : 'Course terminée'}
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
      {!hideMap && (
        <div className="h-72 md:h-full min-h-72">
          <MapView 
            pickup={request.pickup} 
            dropoff={request.dropoff} 
            driverPosition={request.driverPosition} 
            routeOrigin={request.status === 'attribue' && request.driverPosition ? request.driverPosition : request.pickup}
            routeDestination={request.status === 'attribue' ? request.pickup : request.dropoff}
          />
        </div>
      )}
    </div>
  );
}
