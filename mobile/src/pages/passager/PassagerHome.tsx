import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, Sparkles, Package, Map as MapIcon, ArrowRight, Zap } from 'lucide-react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import PlaceSelect from '../../components/PlaceSelect';
import MapView from '../../components/MapView';
import NoorAIBot from '../../components/NoorAIBot';
import { api } from '../../lib/api';
import OffersList from '../../components/OffersList';
import TrackingPanel from '../../components/TrackingPanel';
import ParrainageTab from '../../components/ParrainageTab';
import Wallet from '../../components/Wallet';
import PassengerCarpool from '../../components/PassengerCarpool';
import Support from '../../components/Support';
import { formatFcfa, distanceKm } from '../../lib/geo';
import { CITY_COORDS } from '../../data/cities';
import { VILLES_INTERCITY } from '../../types';
import type { GeoPoint, ServiceType } from '../../types';

export default function PassagerHome() {
  const [tab, setTab] = useState('ride');
  const currentUser = useStore((s) => s.currentUser);
  const requests = useStore((s) => s.requests);
  const createRequest = useStore((s) => s.createRequest);
  const acceptOffer = useStore((s) => s.acceptOffer);
  const declineOffer = useStore((s) => s.declineOffer);
  const cancelRequest = useStore((s) => s.cancelRequest);

  const [surgeMultiplier, setSurgeMultiplier] = useState(1.0);
  const [aiDropoff, setAiDropoff] = useState<GeoPoint | null>(null);
  const [aiCategory, setAiCategory] = useState<any>(null);

  useEffect(() => {
    // Fetch Surge Pricing
    api.get('/surge-pricing').then(res => {
      if (res.data.multiplier) setSurgeMultiplier(res.data.multiplier);
    }).catch(e => console.error(e));
  }, []);

  const handleAIIntent = (data: any) => {
    setTab(data.type || 'ride');
    if (data.dropoff) setAiDropoff(data.dropoff);
    if (data.category) setAiCategory(data.category);
  };

  const allDrivers = useStore((s) => s.drivers);
  const searchRadius = useStore((s) => (s.settings as any).searchRadius || 5);

  const myActives = requests.filter(
    (r) =>
      r.passengerId === currentUser?.id &&
      r.status !== 'annule' &&
      (r.status !== 'termine' || !r.ratingDriver)
  );

  const activeRequest = myActives[0];

  const nearbyCarsActive = useMemo(() => {
    if (!activeRequest || !activeRequest.pickup) return [];
    if (activeRequest.status !== 'recherche' && activeRequest.status !== 'negociation') return [];
    
    return Object.values(allDrivers)
      .filter(d => d.isOnline && d.position)
      .filter(d => distanceKm(d.position!, activeRequest.pickup!) <= searchRadius)
      .map(d => d.position!);
  }, [activeRequest?.pickup, activeRequest?.status, allDrivers, searchRadius]);

  if (activeRequest) {
    return (
      <Layout activeTab={tab} onTabChange={setTab}>
        {activeRequest.status === 'recherche' || activeRequest.status === 'negociation' ? (
          <div className="absolute inset-0 z-0 flex flex-col justify-end pointer-events-none">
            <div className="absolute inset-0 z-0 pointer-events-auto">
              <MapView pickup={activeRequest.pickup ?? undefined} dropoff={activeRequest.dropoff ?? undefined} driverPosition={activeRequest.driverPosition} nearbyCars={nearbyCarsActive} />
            </div>
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-md mx-auto md:absolute md:top-24 md:left-6 md:mx-0 md:w-[400px] pointer-events-none"
            >
              <motion.div
                drag
                dragMomentum={false}
                className="bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 w-full h-full pointer-events-auto cursor-default"
              >
                <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-5 cursor-grab active:cursor-grabbing hover:bg-gray-300 transition" title="Faites glisser pour déplacer" />
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Recherche en cours...</h2>
                  <button
                    onClick={() => cancelRequest(activeRequest.id)}
                    className="bg-red-50 text-noordrive-red px-3 py-1.5 rounded-full text-sm font-semibold"
                  >
                    Annuler
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 mb-4 border border-gray-100">
                  <div className="flex items-center gap-2 font-medium text-black">
                    <span className="w-2 h-2 rounded-full bg-noordrive-green" /> {activeRequest.pickup?.label || 'Départ'}
                  </div>
                  <div className="pl-3 border-l-2 border-dashed border-gray-300 ml-1 my-1 h-3" />
                  <div className="flex items-center gap-2 font-medium text-black">
                    <span className="w-2 h-2 rounded-full bg-noordrive-black" /> {activeRequest.dropoff?.label || 'Arrivée'}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span>Votre proposition</span>
                    <span className="font-bold text-lg text-noordrive-black">{formatFcfa(activeRequest.proposedPrice)}</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto pr-1">
                  <OffersList 
                    offers={activeRequest.offers} 
                    onAccept={(offerId) => acceptOffer(activeRequest.id, offerId)} 
                    onDecline={(offerId) => declineOffer(activeRequest.id, offerId)}
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <TrackingPanel request={activeRequest} viewerRole="passager" />
          </div>
        )}
      </Layout>
    );
  }

  // Si on affiche Historique ou Portefeuille, on ne veut pas la carte en fond, ou on la masque
  if (tab === 'historique' || tab === 'portefeuille' || tab === 'compte' || tab === 'parrainage' || tab === 'support' || tab === 'covoiturage') {
    return (
      <Layout activeTab={tab} onTabChange={setTab}>
        <div className="pt-16 max-w-xl mx-auto w-full">
          {tab === 'historique' && <Historique requests={requests.filter((r) => r.passengerId === currentUser?.id)} />}
          {tab === 'portefeuille' && <Wallet />}
          {tab === 'covoiturage' && <PassengerCarpool />}
          {tab === 'support' && <Support />}
          {tab === 'parrainage' && <ParrainageTab />}
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      <div className="absolute inset-0 z-0 md:hidden">
        <MapView />
      </div>
      
      {/* Surge Pricing Indicator */}
      {surgeMultiplier > 1 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-red-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center gap-2 animate-bounce">
          <Zap className="w-4 h-4 fill-white" /> Majoration tarifaire (x{surgeMultiplier}) - Forte demande
        </div>
      )}

      <NoorAIBot onIntentParsed={handleAIIntent} />
      
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none md:static md:flex-1 md:p-6 md:overflow-y-auto md:bg-gray-50 md:pointer-events-auto w-full">
        <div className="pointer-events-auto max-w-md mx-auto md:max-w-7xl md:w-full">
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 md:p-8 relative max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col"
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar md:justify-center md:gap-4 md:pb-4 border-b border-gray-100">
              {[
                { key: 'ride', label: 'Course', icon: <Car className="w-4 h-4" /> },
                { key: 'delivery', label: 'Colis', icon: <Package className="w-4 h-4" /> },
                { key: 'intercity', label: 'Interurbain', icon: <MapIcon className="w-4 h-4" /> }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    tab === t.key ? 'bg-black text-white shadow-lg shadow-black/20 scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="md:mt-4">
              {tab === 'ride' && <RideForm onCreate={createRequest} initialDropoff={aiDropoff} initialCategory={aiCategory} />}
              {tab === 'delivery' && <DeliveryForm onCreate={createRequest} />}
              {tab === 'intercity' && <IntercityForm onCreate={createRequest} />}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

function RideForm({ onCreate, initialDropoff, initialCategory }: { onCreate: ReturnType<typeof useStore.getState>['createRequest'], initialDropoff: any, initialCategory: any }) {
  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [dropoff, setDropoff] = useState<GeoPoint | null>(initialDropoff);
  const [price, setPrice] = useState<number>(0);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [category, setCategory] = useState<'Standard' | 'Confort' | 'Moto'>(initialCategory || 'Standard');

  useEffect(() => {
    if (initialDropoff) setDropoff(initialDropoff);
    if (initialCategory) setCategory(initialCategory);
  }, [initialDropoff, initialCategory]);

  const allDrivers = useStore((s) => s.drivers);
  const nearbyCars = useMemo(() => {
    if (!pickup) return [];
    return Object.values(allDrivers).filter(d => d.isOnline && (category === 'Moto' ? (d.vehicle as any)?.category === 'Moto' : true)).slice(0, 5).map(d => d.position);
  }, [pickup, allDrivers, category]);

  const [suggestion, setSuggestion] = useState<number | null>(null);

  useEffect(() => {
    if (!pickup && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Ma position actuelle' });
      }, () => {}, { enableHighAccuracy: true });
    }
  }, []);

  useEffect(() => {
    if (pickup && dropoff) {
      import('../../lib/api').then(({ api }) => {
        api.post('/pricing/estimate', { distanceKm: distanceKm(pickup, dropoff), type: 'ride', category })
          .then(res => {
            if (res.data.ok) {
              setSuggestion(res.data.estimatedPrice);
              setPrice(res.data.estimatedPrice);
            }
          });
      });
    } else {
      setSuggestion(null);
    }
  }, [pickup, dropoff, category]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff || price <= 0) return;
    onCreate({ type: 'ride' as ServiceType, pickup, dropoff, proposedPrice: price });
  }

  function handleMapClick(point: GeoPoint) {
    if (!pickup || (pickup && dropoff && !isMapFullscreen)) {
      setPickup(point);
      setDropoff(null);
    } else {
      setDropoff(point);
      if (isMapFullscreen) {
        setTimeout(() => setIsMapFullscreen(false), 500);
      }
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className={`bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm ${isMapFullscreen ? 'hidden md:block' : ''}`}>
        <div>
          <h2 className="font-black text-2xl mb-1 text-gray-800">Où allez-vous ?</h2>
          <p className="text-sm text-gray-500 font-medium">Réservez votre trajet en un instant.</p>
        </div>
        
        <div className="space-y-3 relative">
          <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-200 z-0"></div>
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-black border-2 border-white shadow-sm shrink-0"></div>
             <div className="flex-1">
               <PlaceSelect label="Point de départ" value={pickup?.label ?? ''} onChange={setPickup} />
             </div>
          </div>
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-noordrive-green border-2 border-white shadow-sm shrink-0"></div>
             <div className="flex-1">
               <PlaceSelect label="Destination" value={dropoff?.label ?? ''} onChange={setDropoff} />
             </div>
          </div>
        </div>
        
        <button 
          type="button" 
          onClick={() => setIsMapFullscreen(true)}
          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
        >
          📍 Choisir précisément sur la carte
        </button>

        {/* Sélection du Véhicule */}
        <div className="pt-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Choisissez votre catégorie</label>
          <div className="grid grid-cols-3 gap-3">
            <button 
              type="button" 
              onClick={() => setCategory('Standard')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition ${category === 'Standard' ? 'border-noordrive-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <Car className={`w-8 h-8 ${category === 'Standard' ? 'text-black' : 'text-gray-400'}`} />
              <span className={`text-xs font-bold ${category === 'Standard' ? 'text-black' : 'text-gray-500'}`}>Standard</span>
            </button>
            <button 
              type="button" 
              onClick={() => setCategory('Confort')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition ${category === 'Confort' ? 'border-noordrive-green bg-green-50/30' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <Sparkles className={`w-8 h-8 ${category === 'Confort' ? 'text-noordrive-green' : 'text-gray-400'}`} />
              <span className={`text-xs font-bold ${category === 'Confort' ? 'text-noordrive-green' : 'text-gray-500'}`}>Confort</span>
            </button>
            <button 
              type="button" 
              onClick={() => setCategory('Moto')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition ${category === 'Moto' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <Bike className={`w-8 h-8 ${category === 'Moto' ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className={`text-xs font-bold ${category === 'Moto' ? 'text-orange-500' : 'text-gray-500'}`}>Moto</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
            <span>Votre proposition tarifaire</span>
            {suggestion && <span className="text-noordrive-green">Suggestion : {formatFcfa(suggestion)}</span>}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">FCFA</span>
            <input
              type="number"
              min={100}
              step={50}
              value={price || ''}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-16 pr-4 py-4 font-black text-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-noordrive-green focus:border-transparent transition"
              placeholder={suggestion ? String(suggestion) : '1000'}
            />
          </div>
        </div>
        <button
          disabled={!pickup || !dropoff || price <= 0}
          className="w-full bg-noordrive-black disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-800 transition text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-black/10 active:scale-95"
        >
          Commander maintenant
        </button>
      </form>
      
      <div className={`${isMapFullscreen ? 'fixed inset-0 z-50 bg-white flex' : 'hidden md:flex md:h-[600px] rounded-3xl overflow-hidden shadow-sm border border-gray-100'} w-full flex-col`}>
        {isMapFullscreen && (
          <div className="absolute top-4 left-4 z-[60] flex flex-col gap-2">
            <button onClick={() => setIsMapFullscreen(false)} className="bg-white px-5 py-3 rounded-full shadow-xl font-black text-black border flex items-center gap-2">← Retour au formulaire</button>
          </div>
        )}
        
        {isMapFullscreen && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-black/90 backdrop-blur-md rounded-2xl shadow-2xl p-4 flex flex-col gap-2 text-sm font-medium w-11/12 max-w-sm">
            <div className={`flex items-center gap-3 ${!pickup || (pickup && dropoff) ? 'text-noordrive-green font-bold' : 'text-gray-400'}`}>
              <div className="w-3 h-3 rounded-full bg-current" /> Départ: {pickup ? pickup.label : 'Touchez la carte...'}
            </div>
            <div className={`flex items-center gap-3 ${pickup && !dropoff ? 'text-white font-bold' : 'text-gray-400'}`}>
              <div className="w-3 h-3 rounded-full bg-current" /> Arrivée: {dropoff ? dropoff.label : 'Touchez la carte...'}
            </div>
          </div>
        )}

        <div className="flex-1 w-full relative">
          <div className="absolute inset-0">
            {isMapFullscreen ? (
              <MapView key="fullscreen-map" pickup={pickup ?? undefined} dropoff={dropoff ?? undefined} onMapClick={handleMapClick} nearbyCars={nearbyCars} />
            ) : (
              <div className="hidden md:block w-full h-full">
                <MapView key="inline-map" pickup={pickup ?? undefined} dropoff={dropoff ?? undefined} onMapClick={handleMapClick} nearbyCars={nearbyCars} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryForm({ onCreate }: { onCreate: ReturnType<typeof useStore.getState>['createRequest'] }) {
  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [dropoff, setDropoff] = useState<GeoPoint | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [taille, setTaille] = useState<'petit' | 'moyen' | 'grand'>('petit');
  const [destNom, setDestNom] = useState('');
  const [destPhone, setDestPhone] = useState('');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const allDrivers = useStore((s) => s.drivers);
  const nearbyCars = useMemo(() => {
    if (!pickup) return [];
    return Object.values(allDrivers).filter(d => d.isOnline).slice(0, 5).map(d => d.position);
  }, [pickup, allDrivers]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff || price <= 0) return;
    onCreate({
      type: 'delivery' as ServiceType,
      pickup,
      dropoff,
      proposedPrice: price,
      packageInfo: { description, taille, destinataireNom: destNom, destinatairePhone: destPhone },
    });
  }

  function handleMapClick(point: GeoPoint) {
    if (!pickup || (pickup && dropoff && !isMapFullscreen)) {
      setPickup(point);
      setDropoff(null);
    } else {
      setDropoff(point);
      if (isMapFullscreen) {
        setTimeout(() => setIsMapFullscreen(false), 500);
      }
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className={`bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm ${isMapFullscreen ? 'hidden md:block' : ''}`}>
        <div>
          <h2 className="font-black text-2xl mb-1 text-gray-800 flex items-center gap-2"><Package className="text-orange-500" /> Envoyer un colis</h2>
          <p className="text-sm text-gray-500 font-medium">Livraison rapide et sécurisée.</p>
        </div>
        
        <div className="space-y-3 relative">
          <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-200 z-0"></div>
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-black border-2 border-white shadow-sm shrink-0"></div>
             <div className="flex-1">
               <PlaceSelect label="Point de collecte" value={pickup?.label ?? ''} onChange={setPickup} />
             </div>
          </div>
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-sm shrink-0"></div>
             <div className="flex-1">
               <PlaceSelect label="Point de livraison" value={dropoff?.label ?? ''} onChange={setDropoff} />
             </div>
          </div>
        </div>
        
        <button 
          type="button" 
          onClick={() => setIsMapFullscreen(true)}
          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
        >
          📍 Choisir sur la carte
        </button>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Que voulez-vous envoyer ?</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Clés, Documents, Gâteau..." />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Taille du colis</label>
            <div className="grid grid-cols-3 gap-2">
              {(['petit', 'moyen', 'grand'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTaille(t)}
                  className={`py-2 px-1 text-sm font-bold rounded-xl border-2 capitalize transition ${taille === t ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nom du contact</label>
              <input value={destNom} onChange={(e) => setDestNom(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Bintou" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Téléphone</label>
              <input value={destPhone} onChange={(e) => setDestPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none" placeholder="77 123 45 67" />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            Votre proposition tarifaire
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">FCFA</span>
            <input
              type="number"
              min={100}
              step={50}
              value={price || ''}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-16 pr-4 py-4 font-black text-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              placeholder="1500"
            />
          </div>
        </div>
        <button
          disabled={!pickup || !dropoff || price <= 0 || !description}
          className="w-full bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 hover:bg-orange-600 transition text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95"
        >
          Commander la livraison
        </button>
      </form>
      
      <div className={`${isMapFullscreen ? 'fixed inset-0 z-50 bg-white flex' : 'hidden md:flex md:h-[600px] rounded-3xl overflow-hidden shadow-sm border border-gray-100'} w-full flex-col`}>
        {isMapFullscreen && (
          <div className="absolute top-4 left-4 z-[60] flex flex-col gap-2">
            <button onClick={() => setIsMapFullscreen(false)} className="bg-white px-5 py-3 rounded-full shadow-xl font-black text-black border flex items-center gap-2">← Retour au formulaire</button>
          </div>
        )}
        
        {isMapFullscreen && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-black/90 backdrop-blur-md rounded-2xl shadow-2xl p-4 flex flex-col gap-2 text-sm font-medium w-11/12 max-w-sm">
            <div className={`flex items-center gap-3 ${!pickup || (pickup && dropoff) ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
              <div className="w-3 h-3 rounded-full bg-current" /> Collecte: {pickup ? pickup.label : 'Touchez la carte...'}
            </div>
            <div className={`flex items-center gap-3 ${pickup && !dropoff ? 'text-white font-bold' : 'text-gray-400'}`}>
              <div className="w-3 h-3 rounded-full bg-current" /> Livraison: {dropoff ? dropoff.label : 'Touchez la carte...'}
            </div>
          </div>
        )}

        <div className="flex-1 w-full relative">
          <div className="absolute inset-0">
            {isMapFullscreen ? (
              <MapView key="fullscreen-map" pickup={pickup ?? undefined} dropoff={dropoff ?? undefined} onMapClick={handleMapClick} nearbyCars={nearbyCars} />
            ) : (
              <div className="hidden md:block w-full h-full">
                <MapView key="inline-map" pickup={pickup ?? undefined} dropoff={dropoff ?? undefined} onMapClick={handleMapClick} nearbyCars={nearbyCars} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntercityForm({ onCreate }: { onCreate: ReturnType<typeof useStore.getState>['createRequest'] }) {
  const [villeDepart, setVilleDepart] = useState('Dakar');
  const [villeArrivee, setVilleArrivee] = useState('Thiès');
  const [dateDepart, setDateDepart] = useState('');
  const [places, setPlaces] = useState(1);
  const [price, setPrice] = useState<number>(0);

  const pickup = CITY_COORDS[villeDepart];
  const dropoff = CITY_COORDS[villeArrivee];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (villeDepart === villeArrivee || price <= 0 || !dateDepart) return;
    onCreate({
      type: 'intercity' as ServiceType,
      pickup,
      dropoff,
      proposedPrice: price,
      intercityInfo: { villeDepart, villeArrivee, dateDepart, places },
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm">
        <div>
          <h2 className="font-black text-2xl mb-1 text-gray-800 flex items-center gap-2"><MapIcon className="text-blue-500" /> Covoiturage</h2>
          <p className="text-sm text-gray-500 font-medium">Voyagez entre les villes du pays.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Départ</label>
            <select value={villeDepart} onChange={(e) => setVilleDepart(e.target.value)} className="w-full bg-transparent font-bold text-black outline-none text-lg">
              {VILLES_INTERCITY.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <ArrowRight className="text-gray-300 w-5 h-5 mx-2" />
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Arrivée</label>
            <select value={villeArrivee} onChange={(e) => setVilleArrivee(e.target.value)} className="w-full bg-transparent font-bold text-black outline-none text-lg text-right">
              {VILLES_INTERCITY.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Date de départ</label>
            <input type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Places</label>
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              <button type="button" onClick={() => setPlaces(Math.max(1, places - 1))} className="text-2xl font-bold text-blue-500 px-2">-</button>
              <span className="font-bold text-lg">{places}</span>
              <button type="button" onClick={() => setPlaces(Math.min(4, places + 1))} className="text-2xl font-bold text-blue-500 px-2">+</button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Prix proposé par place</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">FCFA</span>
            <input type="number" min={500} step={100} value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-16 pr-4 py-4 font-black text-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="5000" />
          </div>
        </div>
        <button
          disabled={villeDepart === villeArrivee || price <= 0 || !dateDepart}
          className="w-full bg-blue-500 disabled:bg-gray-200 disabled:text-gray-400 hover:bg-blue-600 transition text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95"
        >
          Réserver le trajet
        </button>
      </form>
      <div className="hidden md:block md:h-[600px] w-full rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <MapView key="inline-map-intercity" pickup={pickup} dropoff={dropoff} center={pickup} />
      </div>
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = { ride: 'Course', delivery: 'Livraison', intercity: 'Ville à ville' };

function Historique({ requests }: { requests: ServiceRequestArray }) {
  const done = requests.filter((r) => r.status === 'termine' || r.status === 'annule');
  if (done.length === 0) return <p className="text-gray-400 text-sm text-center py-10">Aucun historique pour l'instant.</p>;
  return (
    <div className="space-y-3">
      {done.map((r) => (
        <div key={r.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{r.pickup?.label || 'Départ'} → {r.dropoff?.label || 'Arrivée'}</div>
            <div className="text-xs text-gray-500">{TYPE_LABEL[r.type]} · {new Date(r.createdAt).toLocaleString('fr-FR')}</div>
          </div>
          <div className="text-right">
            <div className={`font-bold ${r.status === 'termine' ? 'text-noordrive-green' : 'text-noordrive-red'}`}>
              {r.status === 'termine' ? formatFcfa(r.proposedPrice) : 'Annulé'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type ServiceRequestArray = ReturnType<typeof useStore.getState>['requests'];
