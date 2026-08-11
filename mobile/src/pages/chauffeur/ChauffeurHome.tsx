import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import TrackingPanel from '../../components/TrackingPanel';
import MapView from '../../components/MapView';
import { formatFcfa } from '../../lib/geo';
import { Mic } from 'lucide-react';
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
      r.driverId === driver.id &&
      r.status !== 'annule' &&
      (r.status !== 'termine' || !r.ratingPassenger)
  );

  const isPrivateRide = myActives.length > 0 && myActives[0].type !== 'intercity';
  const isIntercityRide = myActives.length > 0 && myActives[0].type === 'intercity';
  const intercityDestination = isIntercityRide ? myActives[0].intercityInfo?.villeArrivee : null;

  const available = requests.filter(
    (r) =>
      (r.status === 'recherche' || r.status === 'negociation') &&
      !r.offers.some((o) => o.driverId === driver.id) &&
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
  if (!driver.isOnline || tab !== 'demandes') {
    return (
      <Layout activeTab={tab} onTabChange={setTab}>
        <div className="pt-16 max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5 bg-white border rounded-xl p-4 shadow-sm">
            <div>
              <div className="font-semibold">{driver.vehicle.marque} {driver.vehicle.modele}</div>
              <div className="text-xs text-gray-500 mb-2">★ {driver.rating.toFixed(1)} · {driver.vehicle.plaque}</div>
              {/* Gamification Badge */}
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border ${
                currentUser.driverLevel === 'GOLD' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                currentUser.driverLevel === 'SILVER' ? 'bg-gray-200 text-gray-700 border-gray-300' :
                'bg-orange-100 text-orange-700 border-orange-200'
              }`}>
                <span>{currentUser.driverLevel === 'GOLD' ? '🏆 Gold' : currentUser.driverLevel === 'SILVER' ? '🥈 Silver' : '🥉 Bronze'}</span>
                <span className="opacity-70">({currentUser.completedRides || 0} courses)</span>
              </div>
            </div>
            <button 
              onClick={() => driverSetOnline(driver.id, !driver.isOnline)} 
              className={`px-5 py-2 rounded-full font-bold text-white transition ${driver.isOnline ? 'bg-noordrive-red' : 'bg-noordrive-green'}`}
            >
              {driver.isOnline ? 'Passer Hors ligne' : 'Passer En ligne'}
            </button>
          </div>

          {tab === 'demandes' && !driver.isOnline && (
            <div className="bg-gray-100 p-8 rounded-2xl text-center">
              <h2 className="text-xl font-bold mb-2">Vous êtes hors ligne</h2>
              <p className="text-sm text-gray-500">Passez en ligne pour recevoir des courses et augmenter vos revenus aujourd'hui.</p>
            </div>
          )}
          {tab === 'courses' && <CoursesTab requests={requests.filter((r) => r.driverId === driver.id)} />}
          {tab === 'revenus' && <RevenusTab />}
          {tab === 'portefeuille' && <Wallet />}
          {tab === 'microcredit' && <MicroCredit />}
          {tab === 'tontine' && <TontineTab driver={driver} />}
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
        <div className="absolute inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="bg-gray-100 rounded-t-3xl p-4 h-[85vh] overflow-y-auto w-full max-w-xl mx-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mes Passagers ({myActives.length})</h2>
              <button onClick={() => setShowIntercityModal(false)} className="bg-white rounded-full py-1.5 text-sm font-bold shadow-sm px-4">Fermer</button>
            </div>
            <div className="space-y-4 pb-10">
              {myActives.map(req => (
                <div key={req.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                  <div className="p-3 border-b bg-gray-50 font-medium text-sm flex justify-between items-center">
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

      <div className={`absolute ${isIntercityRide ? 'top-36' : 'top-20'} left-1/2 -translate-x-1/2 z-10 bg-noordrive-black text-white px-6 py-2 rounded-full shadow-lg font-bold flex items-center gap-2 transition-all`}>
        <span className="w-2 h-2 bg-noordrive-green rounded-full animate-pulse" /> En ligne
      </div>
      <div className="absolute bottom-6 left-0 right-0 z-10 pointer-events-none px-4">
        <div className="pointer-events-auto max-w-md mx-auto space-y-4">
          <DemandesTab requests={available} driverId={driver.id} />
          
          <button 
            onClick={() => driverSetOnline(driver.id, false)} 
            className="w-full bg-white text-red-600 font-bold py-3 rounded-xl shadow-lg border border-red-100"
          >
            Se déconnecter (Hors ligne)
          </button>
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

  if (requests.length === 0) return <p className="text-center text-gray-400 py-10 text-sm">Aucune demande disponible pour le moment.</p>;

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          key={r.id} 
          className="bg-white border rounded-xl p-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full mr-2">{TYPE_LABEL[r.type]}</span>
              <span className="font-medium">{r.pickup.label} → {r.dropoff.label}</span>
              {r.packageInfo && <div className="text-xs text-gray-500 mt-1">Colis {r.packageInfo.taille} : {r.packageInfo.description}</div>}
              {r.intercityInfo && <div className="text-xs text-gray-500 mt-1">{r.intercityInfo.dateDepart} · {r.intercityInfo.places} place(s)</div>}
            </div>
            <div className="text-noordrive-green font-bold text-xl">{formatFcfa(r.proposedPrice)}</div>
          </div>
          <div className="text-xs text-gray-500 mb-3 text-right">
            Gain estimé : <span className="font-bold text-gray-700">{formatFcfa(r.proposedPrice * 0.88)}</span> (Com. 12%)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => driverMakeOffer(r.id, driverId, r.proposedPrice, 5)}
              className="flex-[2] bg-noordrive-black text-white text-sm font-semibold py-2.5 rounded-xl shadow-md hover:bg-black transition"
            >
              Accepter
            </button>
            <button
              onClick={() => driverMakeOffer(r.id, driverId, r.proposedPrice + 500, 5)}
              className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-2.5 rounded-xl border hover:bg-gray-200 transition"
            >
              +500
            </button>
            {isSupported ? (
              <button
                onClick={() => {
                  if (isListening) stopListening();
                  else startListening((amount) => driverMakeOffer(r.id, driverId, amount, 5));
                }}
                className={`flex-1 flex justify-center items-center py-2.5 rounded-xl border transition ${isListening ? 'bg-red-500 text-white animate-pulse border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
              </button>
            ) : (
              <button
                onClick={() => driverMakeOffer(r.id, driverId, r.proposedPrice + 1000, 5)}
                className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-2.5 rounded-xl border hover:bg-gray-200 transition"
              >
                +1000
              </button>
            )}
          </div>
        </motion.div>
      ))}
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
            <div className="font-medium">{r.pickup.label} → {r.dropoff.label}</div>
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

function MoneyTab({ driverId }: { driverId: string }) {
  const driver = useStore((s) => s.drivers[driverId]);
  const transactions = useStore((s) => s.transactions.filter(t => t.userId === driverId));
  const allLoans = useStore((s) => s.loans);
  const loans = useMemo(() => allLoans.filter((l) => l.driverId === driverId), [allLoans, driverId]);
  const requestLoan = useStore((s) => s.requestLoan);
  const cashoutWallet = useStore((s) => s.cashoutWallet);
  
  const [montant, setMontant] = useState(50000);
  const [motif, setMotif] = useState('');
  const [duree, setDuree] = useState(3);
  const [cashoutAmount, setCashoutAmount] = useState(10000);
  const [loading, setLoading] = useState(false);

  function handleSubmitLoan(e: React.FormEvent) {
    e.preventDefault();
    if (montant <= 0 || !motif) return;
    requestLoan(driverId, montant, motif, duree);
    setMotif('');
  }

  async function handleCashout(method: 'wave' | 'orange_money') {
    if (cashoutAmount <= 0 || cashoutAmount > driver.walletBalance) return;
    setLoading(true);
    await cashoutWallet(driverId, cashoutAmount, method);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-noordrive-black text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-xl gap-4">
        <div>
          <p className="text-gray-400 text-sm">Solde disponible</p>
          <h2 className="text-3xl font-bold mt-1">{formatFcfa(driver.walletBalance)}</h2>
        </div>
        <div className="flex flex-col gap-2 bg-white/10 p-3 rounded-xl w-full md:w-auto">
          <input 
            type="number" 
            value={cashoutAmount || ''} 
            onChange={(e) => setCashoutAmount(Number(e.target.value))} 
            className="w-full bg-white/20 border-none rounded-lg px-3 py-2 text-white placeholder-gray-300 outline-none"
            placeholder="Montant à retirer"
            max={driver.walletBalance}
          />
          <div className="flex gap-2 mt-1">
            <button onClick={() => handleCashout('wave')} disabled={loading || cashoutAmount > driver.walletBalance} className="flex-1 bg-[#1cc6f4] text-white text-sm px-3 py-2 rounded-lg font-bold shadow hover:brightness-110 disabled:opacity-50">Retirer Wave</button>
            <button onClick={() => handleCashout('orange_money')} disabled={loading || cashoutAmount > driver.walletBalance} className="flex-1 bg-[#ff6600] text-white text-sm px-3 py-2 rounded-lg font-bold shadow hover:brightness-110 disabled:opacity-50">Retirer OM</button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmitLoan} className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-lg mb-1">Demander un micro-crédit</h2>
          <p className="text-xs text-gray-500">Financez l'entretien de votre véhicule ou vos frais de carburant.</p>
          <div>
            <label className="text-xs font-medium text-gray-500">Montant souhaité (FCFA)</label>
            <input type="number" min={10000} step={5000} value={montant} onChange={(e) => setMontant(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Motif</label>
            <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Réparation, carburant..." className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Durée de remboursement (mois)</label>
            <select value={duree} onChange={(e) => setDuree(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mt-1">
              {[1, 3, 6, 12].map((d) => <option key={d} value={d}>{d} mois</option>)}
            </select>
          </div>
          <button className="w-full bg-noordrive-gold text-noordrive-black py-3 rounded-full font-semibold hover:brightness-105">Envoyer la demande</button>
        </form>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Mes Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune transaction pour le moment.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {transactions.map((t) => (
                  <div key={t.id} className="bg-white border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{t.description}</div>
                      <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString('fr-FR')}</div>
                    </div>
                    <div className={`font-bold text-sm ${t.amount > 0 ? 'text-noordrive-green' : 'text-noordrive-black'}`}>
                      {t.amount > 0 ? '+' : ''}{formatFcfa(t.amount)}
                      <div className="text-[10px] text-right font-normal opacity-75">{t.status === 'pending' ? 'En attente...' : 'Terminé'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Mes Crédits en cours</h3>
            {loans.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune demande de crédit pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {loans.map((l) => (
                  <div key={l.id} className="bg-white border rounded-xl p-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{formatFcfa(l.montant)}</span>
                      <StatusPill status={l.status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{l.motif} · {l.dureeMois} mois · mensualité {formatFcfa(l.mensualite)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    en_attente: 'bg-gray-100 text-gray-600',
    approuve: 'bg-noordrive-green/10 text-noordrive-green',
    refuse: 'bg-red-50 text-noordrive-red',
    en_cours: 'bg-blue-50 text-blue-600',
    rembourse: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    approuve: 'Approuvé',
    refuse: 'Refusé',
    en_cours: 'En cours',
    rembourse: 'Remboursé',
  };
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors[status]}`}>{labels[status]}</span>;
}
