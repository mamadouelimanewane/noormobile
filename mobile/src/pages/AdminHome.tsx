import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Users, LogOut, CheckCircle2, LayoutDashboard, CreditCard, Activity, TrendingUp, Percent, Wallet, Download, Upload, Edit3, Trash2, Eye, X } from 'lucide-react';
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
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [taxes, setTaxes] = useState<any[]>([]);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDescription, setEditDescription] = useState<string>('Ajustement Admin');

  // CRM Profile State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [crmEdit, setCrmEdit] = useState(false);
  const [crmData, setCrmData] = useState<any>({});

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
      api.get('/admin/transactions').then(res => setTransactions(res.data)).catch(console.error);
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
      api.put(`/admin/taxes/${taxId}`, { isActive: !currentStatus }).then(() => fetchData()).catch(console.error);
    });
  };

  const toggleUserStatus = (driverId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    import('../lib/api').then(({ api }) => {
      api.post('/admin/approve-driver', { driverId, action: newStatus }).then(() => {
        if(selectedUser && selectedUser.id === driverId) {
           setSelectedUser({...selectedUser, accountStatus: newStatus});
        }
        fetchData();
      }).catch(console.error);
    });
  };

  const handleAdjustWallet = (userId: string) => {
    if (!editAmount || editAmount === 0) return setEditingUserId(null);
    import('../lib/api').then(({ api }) => {
      api.post('/admin/wallet/adjust', { userId, amount: editAmount, description: editDescription }).then(() => {
        setEditingUserId(null);
        setEditAmount(0);
        if(selectedUser && selectedUser.id === userId) {
            setSelectedUser({...selectedUser, walletBalance: selectedUser.walletBalance + editAmount});
        }
        fetchData();
      }).catch(console.error);
    });
  };

  const handleSaveCRM = () => {
    import('../lib/api').then(({ api }) => {
      api.put(`/admin/users/${selectedUser.id}`, {
        name: crmData.name,
        phone: crmData.phone,
        vehicleData: selectedUser.role === 'chauffeur' ? {
          marque: crmData.marque,
          modele: crmData.modele,
          plaque: crmData.plaque,
          category: crmData.category
        } : undefined
      }).then((res) => {
        setSelectedUser(res.data);
        setCrmEdit(false);
        fetchData();
      });
    });
  };

  const handleDeleteUser = () => {
    if(window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) {
      import('../lib/api').then(({ api }) => {
        api.delete(`/admin/users/${selectedUser.id}`).then(() => {
          setSelectedUser(null);
          fetchData();
        });
      });
    }
  };

  const openCRM = (user: any) => {
    setSelectedUser(user);
    setCrmData({
      name: user.name,
      phone: user.phone,
      marque: user.vehicle?.marque || '',
      modele: user.vehicle?.modele || '',
      plaque: user.vehicle?.plaque || '',
      category: user.vehicle?.category || 'Standard'
    });
    setCrmEdit(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const data = lines.map(line => {
        const [phone, amount] = line.split(',');
        return { phone: phone?.trim(), amount: Number(amount?.trim()) };
      }).filter(i => i.phone && !isNaN(i.amount));
      
      if(data.length > 0) {
        import('../lib/api').then(({ api }) => {
          api.post('/admin/wallet/import', { data }).then(res => {
            alert(`Succès: ${res.data.success}, Échecs: ${res.data.failed}`);
            fetchData();
          });
        });
      }
    };
    reader.readAsText(file);
  };

  const downloadCSV = (type: 'users' | 'transactions') => {
    let csv = '';
    if (type === 'users') {
      csv = 'ID,Nom,Telephone,Role,Statut,Portefeuille\n';
      usersList.forEach(u => { csv += `${u.id},${u.name},${u.phone},${u.role},${u.accountStatus},${u.walletBalance}\n`; });
    } else {
      csv = 'ID,Date,Nom,Telephone,Role,Type,Montant,Methode,Description\n';
      transactions.forEach(t => { 
        csv += `${t.id},${new Date(t.createdAt).toISOString()},${t.user.name},${t.user.phone},${t.user.role},${t.type},${t.amount},${t.method},${t.description}\n`; 
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${type}_${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-noordrive-black text-white p-6 flex flex-col fixed h-full z-10">
        <h1 className="text-2xl font-black tracking-tighter mb-10"><span className="text-noordrive-green">●</span> ADMIN</h1>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'dashboard' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <LayoutDashboard className="w-5 h-5" /> Vue d'ensemble
          </button>
          <button onClick={() => setTab('finances')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'finances' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Wallet className="w-5 h-5" /> Finances & Comptabilité
          </button>
          <button onClick={() => setTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'users' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Users className="w-5 h-5" /> CRM Utilisateurs
          </button>
          <button onClick={() => setTab('taxes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'taxes' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Percent className="w-5 h-5" /> Moteur de Taxes
          </button>
          <button onClick={() => setTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'settings' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Settings className="w-5 h-5" /> Paramètres Globaux
          </button>
        </nav>

        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition mt-auto">
          <LogOut className="w-5 h-5" /> Déconnexion
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto ml-64">
        
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
                <div><p className="text-gray-500 text-sm font-semibold">Revenus (Commissions)</p><p className="text-2xl font-bold text-noordrive-green">{formatFcfa(stats.totalRevenue)}</p></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'finances' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Livre de Comptes</h2>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl flex items-center gap-2 hover:bg-gray-50">
                  <Upload className="w-4 h-4"/> Importer Rechargements (CSV)
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={() => downloadCSV('transactions')} className="bg-gray-800 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 hover:bg-gray-900">
                  <Download className="w-4 h-4"/> Exporter CSV
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Date</th>
                    <th className="p-4 font-semibold text-gray-600">Utilisateur</th>
                    <th className="p-4 font-semibold text-gray-600">Type</th>
                    <th className="p-4 font-semibold text-gray-600">Méthode</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Montant</th>
                    <th className="p-4 font-semibold text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-500">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="p-4 font-medium">{t.user.name} <span className="text-gray-400 text-xs">({t.user.phone})</span></td>
                      <td className="p-4 uppercase text-xs font-bold text-gray-500">{t.type}</td>
                      <td className="p-4">{t.method}</td>
                      <td className={`p-4 text-right font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {t.amount > 0 ? '+' : ''}{formatFcfa(t.amount)}
                      </td>
                      <td className="p-4 text-gray-500">{t.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-800">CRM Utilisateurs</h2>
                <button onClick={() => downloadCSV('users')} className="bg-gray-800 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 hover:bg-gray-900">
                  <Download className="w-4 h-4"/> Exporter CSV
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600">Nom</th>
                      <th className="p-4 font-semibold text-gray-600">Rôle</th>
                      <th className="p-4 font-semibold text-gray-600">Portefeuille</th>
                      <th className="p-4 font-semibold text-gray-600">Statut (Chauffeur)</th>
                      <th className="p-4 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {usersList.map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50 group cursor-pointer transition" onClick={() => openCRM(u)}>
                        <td className="p-4 font-medium">{u.name} <br/><span className="text-gray-400 text-xs">{u.phone}</span></td>
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
                          <button className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200"><Eye className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CRM Slide Modal */}
            {selectedUser && (
              <div className="w-[400px] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-y-auto max-h-[85vh] sticky top-10">
                <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                  <h3 className="text-xl font-bold">Profil Utilisateur</h3>
                  <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-800"><X/></button>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: selectedUser.avatarColor || '#333' }}>
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{selectedUser.name}</h4>
                      <p className="text-gray-500">{selectedUser.phone}</p>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block uppercase font-bold text-gray-600">{selectedUser.role}</span>
                    </div>
                  </div>

                  {crmEdit ? (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border">
                      <h5 className="font-bold text-sm text-gray-700 mb-2">Édition Rapide</h5>
                      <input type="text" value={crmData.name} onChange={e => setCrmData({...crmData, name: e.target.value})} className="w-full border p-2 rounded" placeholder="Nom" />
                      <input type="text" value={crmData.phone} onChange={e => setCrmData({...crmData, phone: e.target.value})} className="w-full border p-2 rounded" placeholder="Téléphone" />
                      
                      {selectedUser.role === 'chauffeur' && (
                        <>
                          <h5 className="font-bold text-sm text-gray-700 mt-4 mb-2">Véhicule</h5>
                          <input type="text" value={crmData.marque} onChange={e => setCrmData({...crmData, marque: e.target.value})} className="w-full border p-2 rounded" placeholder="Marque" />
                          <input type="text" value={crmData.modele} onChange={e => setCrmData({...crmData, modele: e.target.value})} className="w-full border p-2 rounded" placeholder="Modèle" />
                          <input type="text" value={crmData.plaque} onChange={e => setCrmData({...crmData, plaque: e.target.value})} className="w-full border p-2 rounded" placeholder="Plaque" />
                          <select value={crmData.category} onChange={e => setCrmData({...crmData, category: e.target.value})} className="w-full border p-2 rounded bg-white">
                            <option value="Standard">Standard</option>
                            <option value="Confort">Confort</option>
                            <option value="Moto">Moto</option>
                          </select>
                        </>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleSaveCRM} className="bg-noordrive-green text-white px-4 py-2 rounded-lg font-bold flex-1">Sauvegarder</button>
                        <button onClick={() => setCrmEdit(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold flex-1">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Solde Actuel</h5>
                        <button onClick={() => setCrmEdit(true)} className="text-blue-500 text-sm font-bold flex items-center gap-1"><Edit3 className="w-3 h-3"/> Éditer Profil</button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-black">{formatFcfa(selectedUser.walletBalance)}</span>
                        {editingUserId === selectedUser.id ? (
                           <div className="flex gap-2">
                             <input type="number" placeholder="Montant" className="border w-24 p-1 rounded" onChange={e => setEditAmount(Number(e.target.value))} />
                             <button onClick={() => handleAdjustWallet(selectedUser.id)} className="bg-noordrive-green text-white px-2 rounded">OK</button>
                           </div>
                        ) : (
                          <button onClick={() => setEditingUserId(selectedUser.id)} className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm font-bold hover:bg-gray-200">Ajuster +/-</button>
                        )}
                      </div>

                      {selectedUser.role === 'chauffeur' && (
                        <div className="bg-gray-50 p-4 rounded-xl border">
                          <h5 className="font-bold text-gray-800 mb-2">Statut & KYC</h5>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${selectedUser.accountStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : selectedUser.accountStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {selectedUser.accountStatus}
                            </span>
                            <button onClick={() => toggleUserStatus(selectedUser.id, selectedUser.accountStatus)} className="text-sm font-bold text-blue-600 underline">Basculer (Approuver/Bloquer)</button>
                          </div>
                          
                          <h6 className="text-xs font-bold text-gray-500 mb-1">Véhicule</h6>
                          {selectedUser.vehicle ? (
                            <p className="text-sm">{selectedUser.vehicle.marque} {selectedUser.vehicle.modele} - <span className="font-mono bg-gray-200 px-1 rounded">{selectedUser.vehicle.plaque}</span> ({selectedUser.vehicle.category})</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Aucun véhicule renseigné</p>
                          )}

                          <h6 className="text-xs font-bold text-gray-500 mt-4 mb-1">Documents Uplaodés</h6>
                          {selectedUser.documents && selectedUser.documents.length > 0 ? (
                            <ul className="text-sm space-y-1">
                              {selectedUser.documents.map((d: any) => (
                                <li key={d.id} className="flex justify-between items-center bg-white p-2 rounded border">
                                  <span>{d.type}</span>
                                  <a href={d.url} target="_blank" className="text-blue-500 font-bold text-xs underline">Voir</a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Aucun document soumis</p>
                          )}
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <button onClick={handleDeleteUser} className="w-full flex justify-center items-center gap-2 text-red-500 font-bold hover:bg-red-50 py-2 rounded-lg transition">
                          <Trash2 className="w-4 h-4"/> Supprimer Définitivement le compte
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
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
      </div>
    </div>
  );
}
