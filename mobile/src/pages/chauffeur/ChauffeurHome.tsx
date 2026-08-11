import { useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import TrackingPanel from '../../components/TrackingPanel';
import { formatFcfa } from '../../lib/geo';
import type { Driver, ServiceRequest } from '../../types';

const TABS = [
  { key: 'demandes', label: 'Demandes' },
  { key: 'courses', label: 'Mes courses' },
  { key: 'money', label: 'Portefeuille' },
];

const TYPE_LABEL: Record<string, string> = { ride: 'Course', delivery: 'Livraison', intercity: 'Ville à ville' };

export default function ChauffeurHome() {
  const [tab, setTab] = useState('demandes');
  const currentUser = useStore((s) => s.currentUser)!;
  const driver = useStore((s) => s.drivers[currentUser.id]) as Driver;
  const requests = useStore((s) => s.requests);
  const driverSetOnline = useStore((s) => s.driverSetOnline);

  const myActive = requests.find(
    (r) =>
      r.driverId === driver.id &&
      r.status !== 'annule' &&
      (r.status !== 'termine' || !r.ratingPassenger),
  );

  const available = requests.filter(
    (r) =>
      (r.status === 'recherche' || r.status === 'negociation') &&
      !r.offers.some((o) => o.driverId === driver.id),
  );

  if (myActive) {
    return (
      <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}>
        <h2 className="text-xl font-bold mb-4">Course en cours</h2>
        <TrackingPanel request={myActive} viewerRole="chauffeur" />
      </Layout>
    );
  }

  return (
    <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      <div className="flex items-center justify-between mb-5 bg-white border rounded-xl p-4">
        <div>
          <div className="font-semibold">{driver.vehicle.marque} {driver.vehicle.modele} · {driver.vehicle.plaque}</div>
          <div className="text-xs text-gray-500">★ {driver.rating.toFixed(1)} ({driver.ratingCount} avis) · Solde : {formatFcfa(driver.walletBalance)}</div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <span className={driver.isOnline ? 'text-noordrive-green' : 'text-gray-400'}>{driver.isOnline ? 'En ligne' : 'Hors ligne'}</span>
          <input type="checkbox" checked={driver.isOnline} onChange={(e) => driverSetOnline(driver.id, e.target.checked)} className="w-10 h-5 accent-noordrive-green" />
        </label>
      </div>

      {tab === 'demandes' && (
        !driver.isOnline ? (
          <p className="text-center text-gray-400 py-10 text-sm">Passez en ligne pour voir les demandes disponibles.</p>
        ) : (
          <DemandesTab requests={available} driverId={driver.id} />
        )
      )}
      {tab === 'courses' && <CoursesTab requests={requests.filter((r) => r.driverId === driver.id)} />}
      {tab === 'money' && <MoneyTab driverId={driver.id} />}
    </Layout>
  );
}

function DemandesTab({ requests, driverId }: { requests: ServiceRequest[]; driverId: string }) {
  const driverMakeOffer = useStore((s) => s.driverMakeOffer);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState(0);
  const [counterEta, setCounterEta] = useState(5);

  if (requests.length === 0) return <p className="text-center text-gray-400 py-10 text-sm">Aucune demande disponible pour le moment.</p>;

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full mr-2">{TYPE_LABEL[r.type]}</span>
              <span className="font-medium">{r.pickup.label} → {r.dropoff.label}</span>
              {r.packageInfo && <div className="text-xs text-gray-500 mt-1">Colis {r.packageInfo.taille} : {r.packageInfo.description}</div>}
              {r.intercityInfo && <div className="text-xs text-gray-500 mt-1">{r.intercityInfo.dateDepart} · {r.intercityInfo.places} place(s)</div>}
            </div>
            <div className="text-noordrive-green font-bold">{formatFcfa(r.proposedPrice)}</div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => driverMakeOffer(r.id, driverId, r.proposedPrice, 5)}
              className="bg-noordrive-black text-white text-xs font-semibold px-4 py-1.5 rounded-full"
            >
              Accepter à ce prix
            </button>
            {counterFor === r.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={counterPrice || ''}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  placeholder="Prix"
                  className="border rounded-lg px-2 py-1 text-xs w-24"
                />
                <input
                  type="number"
                  value={counterEta}
                  onChange={(e) => setCounterEta(Number(e.target.value))}
                  placeholder="ETA min"
                  className="border rounded-lg px-2 py-1 text-xs w-16"
                />
                <button
                  onClick={() => {
                    if (counterPrice > 0) {
                      driverMakeOffer(r.id, driverId, counterPrice, counterEta);
                      setCounterFor(null);
                      setCounterPrice(0);
                    }
                  }}
                  className="bg-noordrive-green text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  Envoyer
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCounterFor(r.id)}
                className="border text-xs font-semibold px-4 py-1.5 rounded-full"
              >
                Contre-proposer
              </button>
            )}
          </div>
        </div>
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
