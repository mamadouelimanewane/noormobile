import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import PlaceSelect from '../../components/PlaceSelect';
import OffersList from '../../components/OffersList';
import TrackingPanel from '../../components/TrackingPanel';
import MapView from '../../components/MapView';
import ParrainageTab from '../../components/ParrainageTab';
import Wallet from '../../components/Wallet';
import PassengerCarpool from '../../components/PassengerCarpool';
import Support from '../../components/Support';
import { formatFcfa, distanceKm } from '../../lib/geo';
import { CITY_COORDS } from '../../data/cities';
import { VILLES_INTERCITY } from '../../types';
import type { GeoPoint, ServiceType } from '../../types';


export default function PassagerHome() {
  const [tab, setTab] = useState<string>('ride');
  const currentUser = useStore((s) => s.currentUser)!;
  const allRequests = useStore((s) => s.requests);
  const requests = useMemo(() => allRequests.filter((r) => r.passengerId === currentUser.id), [allRequests, currentUser.id]);
  const createRequest = useStore((s) => s.createRequest);
  const acceptOffer = useStore((s) => s.acceptOffer);
  const declineOffer = useStore((s) => s.declineOffer);
  const cancelRequest = useStore((s) => s.cancelRequest);

  const activeRequest = requests.find(
    (r) => r.status !== 'annule' && (r.status !== 'termine' || !r.ratingDriver),
  );

  if (activeRequest) {
    return (
      <Layout activeTab={tab} onTabChange={setTab}>
        {activeRequest.status === 'recherche' || activeRequest.status === 'negociation' ? (
          <div className="absolute inset-0 z-0 flex flex-col justify-end pointer-events-none">
            <div className="absolute inset-0 z-0 pointer-events-auto">
              <MapView pickup={activeRequest.pickup ?? undefined} dropoff={activeRequest.dropoff ?? undefined} driverPosition={activeRequest.driverPosition} />
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
          {tab === 'historique' && <Historique requests={requests.filter((r) => r.passengerId === currentUser.id)} />}
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
      
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none md:static md:flex-1 md:p-6 md:overflow-y-auto md:bg-gray-50 md:pointer-events-auto w-full">
        <div className="pointer-events-auto max-w-md mx-auto md:max-w-7xl md:w-full">
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 md:p-8"
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar md:justify-center md:gap-4 border-b border-gray-100 md:pb-4">
              {[
                { key: 'ride', label: 'Voiture' },
                { key: 'delivery', label: 'Livraison' },
                { key: 'intercity', label: 'Interurbain' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition ${
                    tab === t.key ? 'bg-noordrive-black text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="md:mt-4">
              {tab === 'ride' && <RideForm onCreate={createRequest} />}
              {tab === 'delivery' && <DeliveryForm onCreate={createRequest} />}
              {tab === 'intercity' && <IntercityForm onCreate={createRequest} />}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

function RideForm({ onCreate }: { onCreate: ReturnType<typeof useStore.getState>['createRequest'] }) {
  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [dropoff, setDropoff] = useState<GeoPoint | null>(null);
  const [price, setPrice] = useState<number>(0);

  const allDrivers = useStore((s) => s.drivers);
  const nearbyCars = useMemo(() => {
    if (!pickup) return [];
    return Object.values(allDrivers).filter(d => d.isOnline).slice(0, 5).map(d => d.position);
  }, [pickup, allDrivers]);

  const [suggestion, setSuggestion] = useState<number | null>(null);

  useEffect(() => {
    if (pickup && dropoff) {
      import('../../lib/api').then(({ api }) => {
        api.post('/pricing/estimate', { distanceKm: distanceKm(pickup, dropoff), type: 'ride', category: 'Standard' })
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
  }, [pickup, dropoff]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff || price <= 0) return;
    onCreate({ type: 'ride' as ServiceType, pickup, dropoff, proposedPrice: price });
  }

  function handleMapClick(point: GeoPoint) {
    if (!pickup) setPickup(point);
    else setDropoff(point);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg mb-1">Demander une course</h2>
        <PlaceSelect label="Départ" value={pickup?.label ?? ''} onChange={setPickup} />
        <PlaceSelect label="Arrivée" value={dropoff?.label ?? ''} onChange={setDropoff} />
        {suggestion && (
          <p className="text-xs text-gray-500">Prix suggéré pour ce trajet : {formatFcfa(suggestion)}</p>
        )}
        <div>
          <label className="text-xs font-medium text-gray-500">Votre prix proposé (FCFA)</label>
          <input
            type="number"
            min={100}
            step={50}
            value={price || ''}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            placeholder={suggestion ? String(suggestion) : '1000'}
          />
        </div>
        <button
          disabled={!pickup || !dropoff || price <= 0}
          className="w-full bg-noordrive-green disabled:opacity-40 hover:bg-noordrive-green-dark transition text-white py-3 rounded-full font-semibold"
        >
          Envoyer ma demande
        </button>
      </form>
      <div className="h-72 md:h-[600px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <MapView pickup={pickup ?? undefined} dropoff={dropoff ?? undefined} onMapClick={handleMapClick} nearbyCars={nearbyCars} />
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
    if (!pickup) setPickup(point);
    else setDropoff(point);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg mb-1">Envoyer un colis</h2>
        <PlaceSelect label="Point de collecte" value={pickup?.label ?? ''} onChange={setPickup} />
        <PlaceSelect label="Point de livraison" value={dropoff?.label ?? ''} onChange={setDropoff} />
        <div>
          <label className="text-xs font-medium text-gray-500">Description du colis</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="Documents, vêtements..." />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Taille</label>
          <select value={taille} onChange={(e) => setTaille(e.target.value as typeof taille)} className="w-full border rounded-lg px-3 py-2 mt-1">
            <option value="petit">Petit</option>
            <option value="moyen">Moyen</option>
            <option value="grand">Grand</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Nom du destinataire</label>
            <input value={destNom} onChange={(e) => setDestNom(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Téléphone destinataire</label>
            <input value={destPhone} onChange={(e) => setDestPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Votre prix proposé (FCFA)</label>
          <input type="number" min={100} step={50} value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="1500" />
        </div>
        <button
          disabled={!pickup || !dropoff || price <= 0}
          className="w-full bg-noordrive-green disabled:opacity-40 hover:bg-noordrive-green-dark transition text-white py-3 rounded-full font-semibold"
        >
          Envoyer ma demande
        </button>
      </form>
      <div className="h-72 md:h-[600px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <MapView pickup={pickup ?? undefined} dropoff={dropoff ?? undefined} onMapClick={handleMapClick} nearbyCars={nearbyCars} />
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
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg mb-1">Trajet ville à ville</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Ville de départ</label>
            <select value={villeDepart} onChange={(e) => setVilleDepart(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1">
              {VILLES_INTERCITY.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Ville d'arrivée</label>
            <select value={villeArrivee} onChange={(e) => setVilleArrivee(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1">
              {VILLES_INTERCITY.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Date de départ</label>
            <input type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Places</label>
            <input type="number" min={1} max={4} value={places} onChange={(e) => setPlaces(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Votre prix proposé (FCFA)</label>
          <input type="number" min={500} step={100} value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="8000" />
        </div>
        <button
          disabled={villeDepart === villeArrivee || price <= 0 || !dateDepart}
          className="w-full bg-noordrive-green disabled:opacity-40 hover:bg-noordrive-green-dark transition text-white py-3 rounded-full font-semibold"
        >
          Envoyer ma demande
        </button>
      </form>
      <div className="h-72 md:h-[600px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <MapView pickup={pickup} dropoff={dropoff} center={pickup} />
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
