import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Users, LogOut, CheckCircle2, LayoutDashboard, CreditCard, Activity, TrendingUp, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatFcfa } from '../lib/geo';

export default function AdminHome() {
  const [tab, setTab] = useState('dashboard');
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();
  
  const [sponsorBonus, setSponsorBonus] = useState(1000);
  const [refereeBonus, setRefereeBonus] = useState(500);
  const [commissionRate, setCommissionRate] = useState(0.12);
  const [baseFare, setBaseFare] = useState(1000);
  const [perKmRate, setPerKmRate] = useState(200);
  const [withdrawalFee, setWithdrawalFee] = useState(0.01);
  const [maxLoanAmount, setMaxLoanAmount] = useState(100000);

  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalRides: 0, totalRevenue: 0 });
  const [usersList, setUsersList] = useState<any[]>([]);
  
  const [taxes, setTaxes] = useState<any[]>([]);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    import('../lib/api').then(({ api }) => {
      api.get('/admin/settings').then(res => {
        setSponsorBonus(res.data.referralBonusSponsor || 1000);
        setRefereeBonus(res.data.referralBonusReferee || 500);
        setCommissionRate(res.data.commissionRate || 0.12);
        setBaseFare(res.data.baseFare || 1000);
        setPerKmRate(res.data.perKmRate || 200);
        setWithdrawalFee(res.data.withdrawalFee || 0.01);
        setMaxLoanAmount(res.data.maxLoanAmount || 100000);
      }).catch(console.error);

      api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
      api.get('/admin/users').then(res => setUsersList(res.data)).catch(console.error);
      api.get('/admin/taxes').then(res => setTaxes(res.data)).catch(console.error);
    });
  };

  const handleSaveSettings = () => {
    import('../lib/api').then(({ api }) => {
      api.post('/admin/settings', {
        referralBonusSponsor: sponsorBonus,
        referralBonusReferee: refereeBonus,
        commissionRate, baseFare, perKmRate, withdrawalFee, maxLoanAmount
      }).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }).catch(console.error);
    });
  };

  const handleCreateTax = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName || !newTaxRate) return;
    import('../lib/api').then(({ api }) => {
      api.post('/admin/taxes', { name: newTaxName, rate: Number(newTaxRate) }).then(() => {
        setNewTaxName('');
        setNewTaxRate('');
        fetchData();
      }).catch(console.error);
    });
  };

  const toggleTaxStatus = (taxId: string, currentStatus: boolean) => {
    import('../lib/api').then(({ api }) => {
      api.put(`/admin/taxes/${taxId}`, { isActive: !currentStatus }).then(() => {
        fetchData();
      }).catch(console.error);
    });
  };

  const toggleUserStatus = (driverId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    import('../lib/api').then(({ api }) => {
      api.post('/admin/approve-driver', { driverId, action: newStatus })
        .then(() => fetchData())
        .catch(console.error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-noordrive-black text-white p-6 flex flex-col">
        <h1 className="text-2xl font-black tracking-tighter mb-10"><span className="text-noordrive-green">●</span> NOORDRIVE ADMIN</h1>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'dashboard' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <LayoutDashboard className="w-5 h-5" /> Vue d'ensemble
          </button>
          <button onClick={() => setTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'users' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Users className="w-5 h-5" /> Utilisateurs
          </button>
          <button onClick={() => setTab('taxes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'taxes' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Percent className="w-5 h-5" /> Moteur de Taxes
          </button>
          <button onClick={() => setTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'settings' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Settings className="w-5 h-5" /> Paramètres Globaux
          </button>
          <button onClick={() => setTab('loans')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'loans' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <CreditCard className="w-5 h-5" /> Micro-crédits
          </button>
        </nav>

        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition mt-auto">
          <LogOut className="w-5 h-5" /> Déconnexion
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        
        {tab === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Vue d'ensemble</h2>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Users className="w-7 h-7" /></div>
                <div><p className="text-gray-500 text-sm font-semibold">Total Inscrits</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-green-500"><Activity className="w-7 h-7" /></div>
                <div><p className="text-gray-500 text-sm font-semibold">Courses Terminées</p><p className="text-2xl font-bold">{stats.totalRides}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500"><TrendingUp className="w-7 h-7" /></div>
                <div><p className="text-gray-500 text-sm font-semibold">Revenus Plateforme</p><p className="text-2xl font-bold">{formatFcfa(stats.totalRevenue)}</p></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'taxes' && (
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Moteur de Taxes</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Créer une nouvelle taxe</h3>
              <form onSubmit={handleCreateTax} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Nom de la taxe (ex: TVA)</label>
                  <input type="text" value={newTaxName} onChange={e => setNewTaxName(e.target.value)} required placeholder="Taxe Municipale" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Taux (ex: 0.18 pour 18%)</label>
                  <input type="number" step="0.001" value={newTaxRate} onChange={e => setNewTaxRate(e.target.value)} required placeholder="0.18" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green" />
                </div>
                <button type="submit" className="bg-noordrive-black text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-gray-800 transition">
                  Ajouter
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Nom de la Taxe</th>
                    <th className="p-4 font-semibold text-gray-600">Taux appliqué</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {taxes.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-500">Aucune taxe configurée.</td></tr>}
                  {taxes.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-800">{t.name}</td>
                      <td className="p-4 font-medium text-noordrive-green">{(t.rate * 100).toFixed(1)}%</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleTaxStatus(t.id, t.isActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${t.isActive ? 'bg-noordrive-green' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${t.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Utilisateurs inscrits</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Nom</th>
                    <th className="p-4 font-semibold text-gray-600">Téléphone</th>
                    <th className="p-4 font-semibold text-gray-600">Rôle</th>
                    <th className="p-4 font-semibold text-gray-600">Portefeuille</th>
                    <th className="p-4 font-semibold text-gray-600">Statut</th>
                    <th className="p-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usersList.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-gray-500">{u.phone}</td>
                      <td className="p-4 capitalize">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'chauffeur' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{u.role}</span>
                      </td>
                      <td className="p-4 font-bold">{formatFcfa(u.walletBalance)}</td>
                      <td className="p-4">
                        {u.role === 'chauffeur' ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${u.accountStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : u.accountStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {u.accountStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.role === 'chauffeur' && (
                          <button 
                            onClick={() => toggleUserStatus(u.id, u.accountStatus)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${u.accountStatus === 'APPROVED' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          >
                            {u.accountStatus === 'APPROVED' ? 'Bloquer' : 'Approuver'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Paramètres de la Plateforme</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
              
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Système de Parrainage</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Bonus Parrain (FCFA)</label>
                    <input type="number" value={sponsorBonus} onChange={(e) => setSponsorBonus(Number(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Bonus Filleul (FCFA)</label>
                    <input type="number" value={refereeBonus} onChange={(e) => setRefereeBonus(Number(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green font-bold" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Commissions & Tarification</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Taux de Commission (ex: 0.12 pour 12%)</label>
                    <input type="number" step="0.01" value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Frais de retrait Wallet (ex: 0.01 pour 1%)</label>
                    <input type="number" step="0.01" value={withdrawalFee} onChange={(e) => setWithdrawalFee(Number(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Prix de base (FCFA)</label>
                    <input type="number" value={baseFare} onChange={(e) => setBaseFare(Number(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Prix au Km (FCFA)</label>
                    <input type="number" value={perKmRate} onChange={(e) => setPerKmRate(Number(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green font-bold" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Micro-crédits</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Plafond Maximum (FCFA)</label>
                    <input type="number" value={maxLoanAmount} onChange={(e) => setMaxLoanAmount(Number(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green font-bold" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-4">
                {saved && <span className="text-noordrive-green font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Enregistré !</span>}
                <button onClick={handleSaveSettings} className="bg-noordrive-green text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:brightness-105 transition">
                  Sauvegarder les modifications
                </button>
              </div>

            </div>
          </div>
        )}

        {tab === 'loans' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Demandes de Micro-crédit</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500 py-20">
              Fonctionnalité en cours d'intégration.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
