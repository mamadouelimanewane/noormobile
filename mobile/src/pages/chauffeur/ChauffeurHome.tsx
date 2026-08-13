import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import TrackingPanel from '../../components/TrackingPanel';
import MapView from '../../components/MapView';
import { formatFcfa } from '../../lib/geo';
import { Mic, Power, Navigation2, CheckCircle2 } from 'lucide-react';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import type { Driver, ServiceRequest } from '../../types';
import ParrainageTab from '../../components/ParrainageTab';
import Wallet from '../../components/Wallet';
import DriverCarpool from '../../components/DriverCarpool';
import MicroCredit from '../../components/MicroCredit';
import Support from '../../components/Support';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<string, string> = { ride: 'Course', delivery: 'Livraison', intercity: 'Ville à ville' };

export default function ChauffeurHome() {
  const [tab, setTab] = useState('demandes');
  const currentUser = useStore((s) => s.currentUser)!;
  const driver = useStore((s) => s.drivers[currentUser.id]) as Driver;
  const requests = useStore((s) => s.requests);
  const driverSetOnline = useStore((s) => s.driverSetOnline);

  const myActives = requests.filter(
    (r) =>
      r.driverId === driver?.id &&
      r.status !== 'annule' &&
      (r.status !== 'termine' || !r.ratingPassenger)
  );

  const isPrivateRide = myActives.length > 0 && myActives[0].type !== 'intercity';
  const isIntercityRide = myActives.length > 0 && myActives[0].type === 'intercity';
  const intercityDestination = isIntercityRide ? myActives[0].intercityInfo?.villeArrivee : null;

  const available = requests.filter(
    (r) =>
      (r.status === 'recherche' || r.status === 'negociation') &&
      !r.offers.some((o) => o.driverId === driver?.id) &&
      (!isIntercityRide || (r.type === 'intercity' && r.intercityInfo?.villeArrivee === intercityDestination))
  );

  const [showIntercityModal, setShowIntercityModal] = useState(false);

  if (isPrivateRide) {
    const myActive = myActives[0];
    return (
      <Layout activeTab={tab} onTabChange={setTab}>
        <div className="absolute inset-0 z-0 flex flex-col justify-end">
          <div className="absolute inset-0 z-0">
            <MapView 
              pickup={myActive.pickup} 
              dropoff={myActive.dropoff} 
              driverPosition={myActive.driverPosition} 
              routeOrigin={myActive.driverPosition}
              routeDestination={myActive.status === 'attribue' ? myActive.pickup : myActive.dropoff}
            />
          </div>
          <div className="h-full flex flex-col justify-end pb-4 px-4 z-10 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md mx-auto">
              <TrackingPanel request={myActive} viewerRole="chauffeur" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Dashboard hors ligne ou autres onglets
  if (!driver || !driver.isOnline || tab !== 'demandes') {
    return (
      <Layout activeTab={tab} onTabChange={setTab}>
        <div className="pt-16 pb-20 max-w-xl mx-auto w-full px-4">
          <div className="flex items-center justify-between mb-6 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                 <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}&backgroundColor=0a8f4c`} alt="Avatar" />
              </div>
              <div>
                <div className="font-black text-lg text-gray-800 leading-tight">{driver?.vehicle?.marque || 'Véhicule'} {driver?.vehicle?.modele || ''}</div>
                <div className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1">
                  <span className="text-yellow-500">★</span> {driver?.rating?.toFixed(1) || '5.0'} <span className="text-gray-300">|</span> {driver?.vehicle?.plaque || 'Non défini'}
                </div>
              </div>
            </div>
          </div>

          {tab === 'demandes' && (!driver || !driver.isOnline) && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-white border-2 border-gray-100 p-8 rounded-[2rem] text-center shadow-lg shadow-black/5 mt-10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-50 to-transparent z-0"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Power className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-gray-800">Vous êtes hors ligne</h2>
                <p className="text-sm font-medium text-gray-500 mb-8 max-w-[250px] mx-auto">Passez en ligne pour recevoir des courses et augmenter vos revenus dès aujourd'hui.</p>
                <button 
                  onClick={() => driver && driverSetOnline(driver.id, true)} 
                  className="w-full bg-noordrive-green hover:bg-green-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-green-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Power className="w-5 h-5" /> GO (En ligne)
                </button>
              </div>
            </motion.div>
          )}
          {tab === 'courses' && <CoursesTab requests={requests.filter((r) => r.driverId === currentUser.id)} />}
          {tab === 'revenus' && <RevenusTab />}
          {tab === 'portefeuille' && <Wallet />}
          {tab === 'microcredit' && <MicroCredit />}
          {tab === 'tontine' && driver && <TontineTab driver={driver} />}
          {tab === 'covoiturage' && <DriverCarpool />}
          {tab === 'support' && <Support />}
          {tab === 'parrainage' && <ParrainageTab />}
        </div>
      </Layout>
    );
  }

  // En ligne : Carte plein écran
  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      <div className="absolute inset-0 z-0">
        <MapView driverPosition={driver.position} />
      </div>
      
      {isIntercityRide && (
        <div className="absolute top-20 left-4 right-4 z-20 max-w-md mx-auto">
          <button 
            onClick={() => setShowIntercityModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-between"
          >
            <span>🚗 Covoiturage vers {intercityDestination}</span>
            <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm">{myActives.length} Passager(s)</span>
          </button>
        </div>
      )}

      {showIntercityModal && (
        <div className="absolute inset-0 z-50 bg-black/60 flex flex-col justify-end backdrop-blur-sm">
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="bg-gray-50 rounded-t-[2rem] p-5 h-[85vh] overflow-y-auto w-full max-w-xl mx-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800">Passagers ({myActives.length})</h2>
              <button onClick={() => setShowIntercityModal(false)} className="bg-white rounded-full py-2 px-5 text-sm font-bold shadow-sm border border-gray-100">Fermer</button>
            </div>
            <div className="space-y-4 pb-10">
              {myActives.map(req => (
                <div key={req.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-700 flex justify-between items-center">
                    <span>{req.passengerName || "Passager"}</span>
                  </div>
                  <div className="p-2">
                    <TrackingPanel request={req} viewerRole="chauffeur" hideMap={true} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <div className={`absolute ${isIntercityRide ? 'top-36' : 'top-20'} left-1/2 -translate-x-1/2 z-10`}>
        <motion.div 
          animate={{ scale: [1, 1.05, 1], boxShadow: ["0px 0px 0px 0px rgba(10,143,76,0)", "0px 0px 20px 5px rgba(10,143,76,0.3)", "0px 0px 0px 0px rgba(10,143,76,0)"] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="bg-white/90 backdrop-blur-md border-2 border-noordrive-green text-noordrive-green px-6 py-2.5 rounded-full shadow-lg font-black text-sm flex items-center gap-3"
        >
          <span className="w-2.5 h-2.5 bg-noordrive-green rounded-full animate-pulse shadow-[0_0_8px_#0a8f4c]" /> En recherche de course
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-10 pointer-events-none px-4 flex flex-col justify-end">
        <div className="pointer-events-auto max-w-md mx-auto w-full space-y-4">
          <DemandesTab requests={available} driverId={driver.id} />
          
          {available.length === 0 && (
            <button 
              onClick={() => driverSetOnline(driver.id, false)} 
              className="w-16 h-16 bg-white hover:bg-gray-50 text-noordrive-red rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex items-center justify-center mx-auto transition-transform active:scale-90 border border-gray-100"
            >
              <Power className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}

function TontineTab({ driver }: { driver: any }) {
  const [tontines, setTontines] = useState<any[]>([]);
  
  useEffect(() => {
    fetchTontines();
  }, []);

  const fetchTontines = async () => {
    try {
      const res = await api.get('/tontine/groups');
      setTontines(res.data);
    } catch(e) {}
  };

  const joinTontine = async (groupId: string) => {
    try {
      await api.post('/tontine/join', { userId: driver.id, groupId });
      toast.success('Vous avez rejoint la tontine avec succès !');
      fetchTontines();
    } catch(e: any) {
      toast.error(e.response?.data?.error || 'Erreur lors de la jonction');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold">Tontines (Nat) Disponibles</h3>
      </div>
      <div className="p-4 space-y-4">
        {tontines.filter(t => t.status === 'OPEN').length === 0 && <p className="text-gray-500 text-sm text-center">Aucune tontine ouverte pour le moment.</p>}
        {tontines.filter(t => t.status === 'OPEN').map(t => (
          <div key={t.id} className="p-4 border rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-bold">{t.name}</h4>
              <p className="text-sm text-gray-500">{t.amountPerPeriod} FCFA / {t.frequency}</p>
              <p className="text-xs text-gray-400 mt-1">Places: {t.members.length}/{t.maxMembers}</p>
            </div>
            <button 
              onClick={() => joinTontine(t.id)}
              className="bg-noordrive-green text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              Rejoindre
            </button>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-b border-gray-100 mt-4">
        <h3 className="font-bold">Mes Tontines Actives</h3>
      </div>
      <div className="p-4 space-y-4">
        {tontines.filter(t => t.members.some((m: any) => m.userId === driver.id)).map(t => {
          const myMember = t.members.find((m: any) => m.userId === driver.id);
          return (
            <div key={t.id} className="p-4 border rounded-xl shadow-sm bg-green-50/50">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">{t.name}</h4>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">{t.status}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Votre tour de réception : <strong>{myMember.turnIndex}</strong> sur {t.maxMembers}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-noordrive-green h-2 rounded-full transition-all" style={{ width: `${(t.cagnotte / (t.amountPerPeriod * t.maxMembers)) * 100}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Cagnotte en cours: {t.cagnotte} F</span>
                <span>Gain attendu: {t.amountPerPeriod * t.maxMembers} F</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

function RevenusTab() {
  const currentUser = useStore((s) => s.currentUser);
  const transactions = useStore((s) => s.transactions.filter(t => t.userId === currentUser?.id && t.type === 'payment' && t.amount > 0));
  
  const today = new Date().toDateString();
  const todayEarnings = transactions
    .filter(t => new Date(t.createdAt).toDateString() === today)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-2xl shadow-xl">
        <p className="text-gray-400 text-sm">Gains du jour</p>
        <h2 className="text-4xl font-bold mt-1">{formatFcfa(todayEarnings)}</h2>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
          <span className="text-sm text-gray-300">Total Historique</span>
          <span className="font-semibold">{formatFcfa(totalEarnings)}</span>
        </div>
      </div>
      
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-bold mb-4 text-lg">Activité Récente</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Aucun revenu pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((t, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <div className="font-medium text-sm">{t.description}</div>
                  <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString('fr-FR')}</div>
                </div>
                <div className="font-bold text-noordrive-green">+{formatFcfa(t.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DemandesTab({ requests, driverId }: { requests: ServiceRequest[]; driverId: string }) {
  const driverMakeOffer = useStore((s) => s.driverMakeOffer);
  const { isListening, isSupported, startListening, stopListening } = useSpeechToText();

  if (requests.length === 0) return null;

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {requests.map((r) => (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            key={r.id} 
            className="bg-white rounded-[1.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)] overflow-hidden relative"
          >
            {/* Top Indicator bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-noordrive-green to-teal-400" />
            
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-1 rounded-md">{TYPE_LABEL[r.type]}</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1"><Navigation2 className="w-3 h-3"/> 2 min</span>
                  </div>
                  <div className="space-y-2 relative">
                    <div className="absolute left-2.5 top-2.5 bottom-2.5 w-px bg-gray-200 z-0"></div>
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-5 h-5 rounded-full bg-white border-4 border-black shrink-0 mt-0.5 shadow-sm"></div>
                      <span className="font-bold text-sm text-gray-800 leading-snug">{r.pickup?.label || 'Départ'}</span>
                    </div>
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-5 h-5 rounded-full bg-white border-4 border-noordrive-green shrink-0 mt-0.5 shadow-sm"></div>
                      <span className="font-bold text-sm text-gray-800 leading-snug">{r.dropoff?.label || 'Arrivée'}</span>
                    </div>
                  </div>
                  {r.packageInfo && <div className="text-xs font-medium bg-orange-50 text-orange-700 px-3 py-2 rounded-lg mt-3 border border-orange-100">📦 Colis {r.packageInfo.taille} : {r.packageInfo.description}</div>}
                  {r.intercityInfo && <div className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-2 rounded-lg mt-3 border border-blue-100">🗓️ {r.intercityInfo.dateDepart} · {r.intercityInfo.places} place(s)</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-black leading-none">{formatFcfa(r.proposedPrice)}</div>
                  <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                    Gains nets : <span className="text-noordrive-green">{formatFcfa(r.proposedPrice * 0.88)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => driverMakeOffer(r.id, driverId, r.proposedPrice, 5)}
                  className="flex-[2] bg-noordrive-green hover:bg-green-700 text-white text-sm font-black py-4 rounded-xl shadow-lg shadow-green-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Accepter
                </button>
                <div className="flex-1 grid grid-rows-2 gap-2">
                  <button
                    onClick={() => driverMakeOffer(r.id, driverId, r.proposedPrice + 500, 5)}
                    className="bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    +500F
                  </button>
                  {isSupported ? (
                    <button
                      onClick={() => {
                        if (isListening) stopListening();
                        else startListening((amount) => { if (amount !== null) driverMakeOffer(r.id, driverId, amount, 5); });
                      }}
                      className={`flex justify-center items-center rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                    </button>
                  ) : (
                    <button
                      onClick={() => driverMakeOffer(r.id, driverId, r.proposedPrice + 1000, 5)}
                      className="bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      +1000F
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function CoursesTab({ requests }: { requests: ServiceRequest[] }) {
  const done = requests.filter((r) => r.status === 'termine' || r.status === 'annule');
  if (done.length === 0) return <p className="text-center text-gray-400 py-10 text-sm">Aucune course terminée pour le moment.</p>;
  return (
    <div className="space-y-3">
      {done.map((r) => (
        <div key={r.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{r.pickup?.label || 'Départ'} → {r.dropoff?.label || 'Arrivée'}</div>
            <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('fr-FR')}</div>
          </div>
          <div className={`font-bold ${r.status === 'termine' ? 'text-noordrive-green' : 'text-noordrive-red'}`}>
            {r.status === 'termine' ? formatFcfa(Math.round(r.proposedPrice * 0.88)) : 'Annulé'}
          </div>
        </div>
      ))}
    </div>
  );
}

