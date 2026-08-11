import { useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { formatFcfa } from '../../lib/geo';

const TABS = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'requests', label: 'Courses' },
  { key: 'loans', label: 'NOORDRIVE.Money' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'settings', label: 'Paramètres' },
];

export default function AdminHome() {
  const [tab, setTab] = useState('overview');
  const requests = useStore((s) => s.requests);
  const drivers = useStore((s) => s.drivers);
  const passengers = useStore((s) => s.passengers);
  const loans = useStore((s) => s.loans);
  const transactions = useStore((s) => s.transactions);
  const settings = useStore((s) => s.settings);
  const setLoanStatus = useStore((s) => s.setLoanStatus);

  const termines = requests.filter((r) => r.status === 'termine');
  const enCours = requests.filter((r) => r.status === 'attribue' || r.status === 'en_cours');
  const revenuBrut = termines.reduce((sum, r) => sum + r.proposedPrice, 0);
  const commission = Math.round(revenuBrut * settings.commissionRate);
  const activeDrivers = Object.values(drivers).filter((d) => d.isOnline);
  const realDrivers = Object.values(drivers).filter((d) => !d.isBot);
  const realPassengers = Object.values(passengers);

  return (
    <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Courses en cours" value={String(enCours.length)} />
            <StatCard label="Courses terminées" value={String(termines.length)} />
            <StatCard label="Chauffeurs en ligne" value={String(activeDrivers.length)} />
            <StatCard label="Commission plateforme" value={formatFcfa(commission)} highlight />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Chauffeurs inscrits" value={String(realDrivers.length)} />
            <StatCard label="Passagers inscrits" value={String(realPassengers.length)} />
            <StatCard label="Volume total" value={formatFcfa(revenuBrut)} />
            <StatCard label="Demandes de crédit" value={String(loans.filter((l) => l.status === 'en_attente').length)} />
          </div>

          <div className="bg-white border rounded-xl p-5 mt-6">
            <h3 className="font-bold mb-4">Liens Rapides pour Démo (Auto-login)</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Chauffeurs :</h4>
                <div className="flex flex-wrap gap-2">
                  {realDrivers.slice(0, 5).map(d => (
                    <button key={d.id} onClick={() => window.open(`/connexion?role=chauffeur&phone=${d.phone}`, '_blank')} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200">
                      {d.name} ({d.phone})
                    </button>
                  ))}
                  {realDrivers.length === 0 && <span className="text-xs text-gray-500">Aucun chauffeur inscrit</span>}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Passagers :</h4>
                <div className="flex flex-wrap gap-2">
                  {realPassengers.slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => window.open(`/connexion?role=passager&phone=${p.phone}`, '_blank')} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200">
                      {p.name} ({p.phone})
                    </button>
                  ))}
                  {realPassengers.length === 0 && <span className="text-xs text-gray-500">Aucun passager inscrit</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-2">
          {requests.length === 0 && <p className="text-gray-400 text-sm text-center py-10">Aucune course pour le moment.</p>}
          {requests.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{r.pickup.label} → {r.dropoff.label}</span>
                <span className="text-gray-400 ml-2 capitalize">({r.type})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-noordrive-green font-semibold">{formatFcfa(r.proposedPrice)}</span>
                <StatusPill status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'loans' && (
        <div className="space-y-3">
          {loans.length === 0 && <p className="text-gray-400 text-sm text-center py-10">Aucune demande de crédit.</p>}
          {loans.map((l) => (
            <div key={l.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{l.driverName} · {formatFcfa(l.montant)}</div>
                <div className="text-xs text-gray-500">{l.motif} · {l.dureeMois} mois · mensualité {formatFcfa(l.mensualite)}</div>
              </div>
              {l.status === 'en_attente' ? (
                <div className="flex gap-2">
                  <button onClick={() => setLoanStatus(l.id, 'approuve')} className="bg-noordrive-green text-white text-xs font-semibold px-3 py-1.5 rounded-full">Approuver</button>
                  <button onClick={() => setLoanStatus(l.id, 'refuse')} className="border text-xs font-semibold px-3 py-1.5 rounded-full text-noordrive-red">Refuser</button>
                </div>
              ) : (
                <StatusPill status={l.status} />
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'transactions' && (
        <div className="space-y-3">
          {transactions.length === 0 && <p className="text-gray-400 text-sm text-center py-10">Aucune transaction.</p>}
          {transactions.map((t) => (
            <div key={t.id} className="bg-white border rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${t.type === 'topup' ? 'bg-blue-100 text-blue-700' : t.type === 'cashout' ? 'bg-orange-100 text-orange-700' : t.type === 'commission' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>
                    {t.type}
                  </span>
                  <span className="font-medium text-sm">{t.description}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{new Date(t.createdAt).toLocaleString('fr-FR')} · {t.userRole}</div>
              </div>
              <div className={`font-bold text-sm ${t.amount > 0 ? 'text-noordrive-green' : 'text-noordrive-red'}`}>
                {t.amount > 0 ? '+' : ''}{formatFcfa(t.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && <SettingsTab />}
    </Layout>
  );
}

function SettingsTab() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const [commission, setCommission] = useState(settings.commissionRate * 100);
  const [tax, setTax] = useState(settings.taxRate * 100);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({ commissionRate: commission / 100, taxRate: tax / 100 });
    alert('Paramètres mis à jour !');
  }

  return (
    <form onSubmit={handleSave} className="bg-white border rounded-xl p-5 space-y-5 max-w-lg">
      <h2 className="font-bold text-lg mb-1">Configuration Financière</h2>
      
      <div>
        <label className="text-sm font-medium text-gray-700">Taux de Commission Plateforme (%)</label>
        <p className="text-xs text-gray-500 mb-2">Pourcentage prélevé sur les gains des chauffeurs.</p>
        <input type="number" min={0} max={50} value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">TVA / Taxes (%)</label>
        <p className="text-xs text-gray-500 mb-2">TVA appliquée sur les factures générées.</p>
        <input type="number" min={0} max={50} value={tax} onChange={(e) => setTax(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
      </div>

      <button className="w-full bg-noordrive-black text-white py-3 rounded-xl font-bold hover:brightness-110">
        Enregistrer les paramètres
      </button>
    </form>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${highlight ? 'bg-noordrive-black text-white' : 'bg-white'}`}>
      <div className={`text-xs ${highlight ? 'text-white/60' : 'text-gray-500'}`}>{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    recherche: { label: 'Recherche', color: 'bg-gray-100 text-gray-600' },
    negociation: { label: 'Négociation', color: 'bg-yellow-50 text-yellow-700' },
    attribue: { label: 'Attribué', color: 'bg-blue-50 text-blue-600' },
    en_cours: { label: 'En cours', color: 'bg-blue-50 text-blue-600' },
    termine: { label: 'Terminé', color: 'bg-noordrive-green/10 text-noordrive-green' },
    annule: { label: 'Annulé', color: 'bg-red-50 text-noordrive-red' },
    en_attente: { label: 'En attente', color: 'bg-gray-100 text-gray-600' },
    approuve: { label: 'Approuvé', color: 'bg-noordrive-green/10 text-noordrive-green' },
    refuse: { label: 'Refusé', color: 'bg-red-50 text-noordrive-red' },
    rembourse: { label: 'Remboursé', color: 'bg-gray-100 text-gray-600' },
  };
  const s = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>;
}
