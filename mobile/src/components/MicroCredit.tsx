import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { formatFcfa } from '../lib/geo';
import { Landmark, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function MicroCredit() {
  const currentUser = useStore((s) => s.currentUser);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ montant: 50000, motif: 'Entretien véhicule', dureeMois: 3 });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await api.get(`/loans/driver/${currentUser?.id}`);
      setLoans(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/loans/request', {
        driverId: currentUser?.id,
        montant: Number(form.montant),
        motif: form.motif,
        dureeMois: Number(form.dureeMois)
      });
      alert('Demande envoyée avec succès.');
      setShowForm(false);
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la demande');
    }
    setLoading(false);
  };

  const activeLoan = loans.find(l => l.status === 'en_cours' || l.status === 'en_attente');

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-[calc(100vh-60px)]">
      
      {activeLoan ? (
        <div className={`rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden ${activeLoan.status === 'en_cours' ? 'bg-blue-600' : 'bg-orange-500'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <Landmark className="w-5 h-5"/>
            <span className="font-bold text-sm">Prêt {activeLoan.status === 'en_cours' ? 'en cours' : 'en attente'}</span>
          </div>
          <h2 className="text-4xl font-black mb-2">{formatFcfa(activeLoan.montant)}</h2>
          <p className="opacity-90 mb-4">{activeLoan.motif}</p>
          
          {activeLoan.status === 'en_cours' && (
            <div className="bg-white/20 rounded-xl p-4 mt-4">
              <div className="flex justify-between text-sm font-bold mb-1">
                <span>Remboursé</span>
                <span>{Math.round((activeLoan.montantRembourse / activeLoan.montant)*100)}%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                <div className="bg-white h-2 rounded-full" style={{width: `${(activeLoan.montantRembourse / activeLoan.montant)*100}%`}}></div>
              </div>
              <div className="flex justify-between text-xs opacity-90">
                <span>{formatFcfa(activeLoan.montantRembourse)} payé</span>
                <span>Reste {formatFcfa(activeLoan.montant - activeLoan.montantRembourse)}</span>
              </div>
              <div className="mt-3 text-xs bg-black/20 p-2 rounded-lg text-center">
                Les remboursements (20%) sont déduits automatiquement de vos courses.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-noordrive-black rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
           <Landmark className="w-12 h-12 text-noordrive-green mb-4" />
           <h2 className="text-xl font-bold mb-2">Besoin d'un coup de pouce ?</h2>
           <p className="text-gray-400 text-sm mb-6">Demandez un micro-crédit jusqu'à 100 000 FCFA pour l'entretien de votre véhicule ou le carburant.</p>
           
           {!showForm && (
             <button onClick={() => setShowForm(true)} className="w-full bg-noordrive-green text-white font-bold py-3 rounded-xl hover:brightness-110 transition">
               Demander un crédit
             </button>
           )}
        </div>
      )}

      {showForm && !activeLoan && (
        <form onSubmit={handleRequest} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4">Nouvelle demande</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Montant souhaité (Max 100 000 FCFA)</label>
            <input type="number" required max="100000" min="5000" step="1000" value={form.montant} onChange={e=>setForm({...form, montant: Number(e.target.value)})} className="w-full border-2 rounded-xl p-3 font-bold focus:border-blue-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Motif du prêt</label>
            <select value={form.motif} onChange={e=>setForm({...form, motif: e.target.value})} className="w-full border-2 rounded-xl p-3 font-medium bg-white focus:border-blue-500 outline-none">
              <option>Entretien véhicule</option>
              <option>Achat de carburant</option>
              <option>Assurance</option>
              <option>Autre urgence</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Durée (Mois)</label>
            <input type="number" required max="6" min="1" value={form.dureeMois} onChange={e=>setForm({...form, dureeMois: Number(e.target.value)})} className="w-full border-2 rounded-xl p-3 font-bold focus:border-blue-500 outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-2 flex items-center justify-center">
            {loading ? 'Envoi...' : 'Soumettre la demande'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="w-full text-gray-500 font-bold py-2">Annuler</button>
        </form>
      )}

      <div>
        <h3 className="font-bold text-gray-800 mb-4 px-1">Historique des demandes</h3>
        <div className="space-y-3">
          {loans.length === 0 && <p className="text-gray-500 text-center py-8">Aucun historique</p>}
          {loans.map(loan => (
            <div key={loan.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${loan.status === 'rembourse' ? 'bg-green-100 text-green-600' : loan.status === 'refuse' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {loan.status === 'rembourse' ? <CheckCircle className="w-5 h-5"/> : loan.status === 'refuse' ? <AlertCircle className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">{loan.motif}</p>
                  <p className="text-xs text-gray-500">{new Date(loan.createdAt).toLocaleDateString()} • <span className="capitalize">{loan.status.replace('_',' ')}</span></p>
                </div>
              </div>
              <div className="font-black text-gray-800">
                {formatFcfa(loan.montant)}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
