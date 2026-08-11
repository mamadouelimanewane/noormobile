import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Users, LogOut, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminHome() {
  const [tab, setTab] = useState('settings');
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();
  
  const [sponsorBonus, setSponsorBonus] = useState(1000);
  const [refereeBonus, setRefereeBonus] = useState(500);
  const [commissionRate, setCommissionRate] = useState(0.12);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    import('../lib/api').then(({ api }) => {
      api.get('/admin/settings').then(res => {
        setSponsorBonus(res.data.referralBonusSponsor || 1000);
        setRefereeBonus(res.data.referralBonusReferee || 500);
        setCommissionRate(res.data.commissionRate || 0.12);
      }).catch(console.error);
    });
  }, []);

  const handleSave = () => {
    import('../lib/api').then(({ api }) => {
      api.post('/admin/settings', {
        referralBonusSponsor: sponsorBonus,
        referralBonusReferee: refereeBonus,
        commissionRate: commissionRate
      }).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }).catch(console.error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-noordrive-black text-white p-6 flex flex-col">
        <h1 className="text-2xl font-black tracking-tighter mb-10"><span className="text-noordrive-green">●</span> NOORDRIVE ADMIN</h1>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'settings' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Settings className="w-5 h-5" /> Paramètres Globaux
          </button>
          <button 
            onClick={() => setTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'users' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Users className="w-5 h-5" /> Utilisateurs
          </button>
        </nav>

        <button 
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition"
        >
          <LogOut className="w-5 h-5" /> Déconnexion
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        {tab === 'settings' && (
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Paramètres de la Plateforme</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
              
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Système de Parrainage</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Bonus Parrain (FCFA)</label>
                    <input 
                      type="number" 
                      value={sponsorBonus}
                      onChange={(e) => setSponsorBonus(Number(e.target.value))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green transition font-bold text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">Versé au portefeuille de celui qui invite.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Bonus Filleul (FCFA)</label>
                    <input 
                      type="number" 
                      value={refereeBonus}
                      onChange={(e) => setRefereeBonus(Number(e.target.value))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green transition font-bold text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">Versé au nouvel inscrit comme cadeau de bienvenue.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Commissions & Taxes</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Taux de Commission (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-noordrive-green transition font-bold text-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-4">
                {saved && <span className="text-noordrive-green font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Enregistré !</span>}
                <button onClick={handleSave} className="bg-noordrive-green text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:brightness-105 transition">
                  Sauvegarder les modifications
                </button>
              </div>

            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Gestion des Utilisateurs</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500 py-20">
              Module en cours de développement.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
