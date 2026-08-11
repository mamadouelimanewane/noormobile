import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { formatFcfa } from '../lib/geo';
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Clock, SmartphoneNfc } from 'lucide-react';

export default function Wallet() {
  const user = useStore(s => s.user);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [showTopup, setShowTopup] = useState(false);
  const [showCashout, setShowCashout] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('wave');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await api.get(`/wallet/history/${user?.id}`);
      setBalance(res.data.balance);
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate Payment Gateway delay
      await new Promise(r => setTimeout(r, 2000));
      await api.post('/wallet/topup', { userId: user?.id, amount: Number(amount), method });
      alert(`Rechargement de ${formatFcfa(Number(amount))} réussi via ${method.toUpperCase()} !`);
      setShowTopup(false);
      setAmount('');
      fetchWallet();
    } catch (err) {
      alert('Erreur lors du rechargement');
    }
    setLoading(false);
  };

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/wallet/cashout', { userId: user?.id, amount: Number(amount), method, phone });
      alert(`Demande de retrait envoyée pour ${formatFcfa(Number(amount))}`);
      setShowCashout(false);
      setAmount('');
      fetchWallet();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors du retrait');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-60px)] p-4 pb-24">
      {/* Balance Card */}
      <div className="bg-noordrive-black text-white rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <WalletIcon className="w-5 h-5"/>
          <span className="font-medium">Solde Disponible</span>
        </div>
        <h2 className="text-4xl font-black mb-6">{formatFcfa(balance)}</h2>
        
        <div className="flex gap-3">
          <button onClick={() => {setShowTopup(true); setShowCashout(false)}} className="flex-1 bg-white text-noordrive-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition">
            <ArrowDownToLine className="w-4 h-4"/> Recharger
          </button>
          <button onClick={() => {setShowCashout(true); setShowTopup(false)}} className="flex-1 bg-noordrive-green text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-105 transition">
            <ArrowUpFromLine className="w-4 h-4"/> Retirer
          </button>
        </div>
      </div>

      {/* Topup Form */}
      {showTopup && (
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4">Recharger par Mobile Money</h3>
          <form onSubmit={handleTopup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Méthode</label>
              <select value={method} onChange={e=>setMethod(e.target.value)} className="w-full border-2 rounded-xl p-3 focus:border-noordrive-green outline-none bg-white font-medium">
                <option value="wave">Wave (Sénégal/CI)</option>
                <option value="orange_money">Orange Money</option>
                <option value="paycard">Paycard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Montant (FCFA)</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} required min="500" placeholder="Ex: 5000" className="w-full border-2 rounded-xl p-3 focus:border-noordrive-green outline-none font-bold text-lg" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              {loading ? 'Traitement en cours...' : <><SmartphoneNfc className="w-5 h-5"/> Payer {amount ? formatFcfa(Number(amount)) : ''}</>}
            </button>
            <button type="button" onClick={()=>setShowTopup(false)} className="w-full text-gray-500 font-bold py-2">Annuler</button>
          </form>
        </div>
      )}

      {/* Cashout Form */}
      {showCashout && (
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4">Retirer mes fonds</h3>
          <form onSubmit={handleCashout} className="space-y-4">
             <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Méthode de retrait</label>
              <select value={method} onChange={e=>setMethod(e.target.value)} className="w-full border-2 rounded-xl p-3 focus:border-noordrive-green outline-none bg-white font-medium">
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Numéro de téléphone</label>
              <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} required className="w-full border-2 rounded-xl p-3 focus:border-noordrive-green outline-none font-bold text-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Montant à retirer (FCFA)</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} required min="1000" placeholder="Ex: 5000" className="w-full border-2 rounded-xl p-3 focus:border-noordrive-green outline-none font-bold text-lg" />
              <p className="text-xs text-gray-500 mt-1">Des frais de plateforme seront appliqués par l'administrateur.</p>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-noordrive-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              {loading ? 'Traitement...' : 'Valider le retrait'}
            </button>
            <button type="button" onClick={()=>setShowCashout(false)} className="w-full text-gray-500 font-bold py-2">Annuler</button>
          </form>
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4 px-1">Historique des transactions</h3>
        <div className="space-y-3">
          {transactions.length === 0 && <p className="text-gray-500 text-center py-8">Aucune transaction</p>}
          {transactions.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {t.amount > 0 ? <ArrowDownToLine className="w-5 h-5"/> : <ArrowUpFromLine className="w-5 h-5"/>}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800 capitalize">{t.type}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(t.createdAt).toLocaleDateString()} • {t.status}</p>
                </div>
              </div>
              <div className={`font-black ${t.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                {t.amount > 0 ? '+' : ''}{formatFcfa(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
