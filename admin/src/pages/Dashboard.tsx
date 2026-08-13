import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Users, LogOut, CheckCircle2, LayoutDashboard, Activity, TrendingUp, Percent, Wallet, Download, Upload, Edit3, Trash2, Eye, X, Landmark, CheckCircle, XCircle, FileSpreadsheet, BarChart2, Users2, HelpCircle, Map, Gift, ShieldAlert, Headset, Building, AlertTriangle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatFcfa } from '../lib/geo';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { api } from '../lib/api';

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
  const [loans, setLoans] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  
  const [taxes, setTaxes] = useState<any[]>([]);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDescription] = useState<string>('Ajustement Admin');

  // CRM Profile State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [crmEdit, setCrmEdit] = useState(false);
  const [crmData, setCrmData] = useState<any>({});
  const [tontines, setTontines] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchTontines();
  }, []);

  const fetchTontines = async () => {
    try {
      const res = await api.get('/tontine/groups');
      setTontines(res.data);
    } catch(_e) {}
  };

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
      api.get('/admin/loans').then(res => setLoans(res.data)).catch(console.error);
      api.get('/admin/tickets').then(res => setTickets(res.data)).catch(console.error);
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

  const handleApproveLoan = (loanId: string) => {
    if(window.confirm('Valider ce prêt ? Le montant sera crédité sur le Wallet du chauffeur.')) {
      import('../lib/api').then(({ api }) => {
        api.post('/admin/loans/approve', { loanId }).then(() => fetchData()).catch(console.error);
      });
    }
  };

  const handleRejectLoan = (loanId: string) => {
    if(window.confirm('Refuser cette demande de prêt ?')) {
      import('../lib/api').then(({ api }) => {
        api.post('/admin/loans/reject', { loanId }).then(() => fetchData()).catch(console.error);
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

  const loadTicket = (id: string) => {
    import('../lib/api').then(({ api }) => {
      api.get(`/support/tickets/${id}`).then(res => setActiveTicket(res.data)).catch(console.error);
    });
  };

  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if(!replyText.trim() || !activeTicket) return;
    import('../lib/api').then(({ api }) => {
      // In AdminHome we assume admin's ID or system senderId
      api.post(`/support/tickets/${activeTicket.id}/messages`, { senderId: 'ADMIN', text: replyText, isAdmin: true }).then(() => {
        setReplyText('');
        loadTicket(activeTicket.id);
        fetchData();
      }).catch(console.error);
    });
  };

  const handleResolveTicket = (id: string) => {
    import('../lib/api').then(({ api }) => {
      api.put(`/support/tickets/${id}/status`, { status: 'RESOLVED' }).then(() => {
        if(activeTicket?.id === id) loadTicket(id);
        fetchData();
      }).catch(console.error);
    });
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
      <div className="w-64 bg-noordrive-black text-white p-6 flex flex-col fixed h-full z-10 overflow-y-auto">
        <h1 className="text-2xl font-black tracking-tighter mb-10"><span className="text-noordrive-green">●</span> ADMIN</h1>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'dashboard' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <LayoutDashboard className="w-5 h-5" /> Vue d'ensemble
          </button>
          <button onClick={() => setTab('liveops')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'liveops' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Map className="w-5 h-5" /> Live Operations
          </button>
          <button onClick={() => setTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'users' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Users className="w-5 h-5" /> CRM Utilisateurs
          </button>
          <button onClick={() => setTab('finances')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'finances' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Wallet className="w-5 h-5" /> Finances & Compta
          </button>
          <button onClick={() => setTab('marketing')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'marketing' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Gift className="w-5 h-5" /> Marketing & Promo
          </button>
          <button onClick={() => setTab('risk')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'risk' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <ShieldAlert className="w-5 h-5" /> Risques & Fraudes
          </button>
          <button onClick={() => setTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'analytics' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <BarChart2 className="w-5 h-5" /> Data Intelligence
          </button>
          <button onClick={() => setTab('dispatcher')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'dispatcher' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Headset className="w-5 h-5" /> Dispatcher (Manuel)
          </button>
          <button onClick={() => setTab('fleet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'fleet' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
            <Building className="w-5 h-5" /> B2B & Flottes
          </button>
          <button onClick={() => setTab('sos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'sos' ? 'bg-red-500/20 text-red-500' : 'text-red-400 hover:bg-red-500/10'}`}>
            <AlertTriangle className="w-5 h-5" /> Centre d'Urgences
          </button>
          <button onClick={() => setTab('loyalty')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'loyalty' ? 'bg-yellow-500/20 text-yellow-500' : 'text-yellow-500/80 hover:bg-yellow-500/10'}`}>
            <Trophy className="w-5 h-5" /> Programme VIP
          </button>
          <div className="border-t border-gray-800 my-2 pt-2">
            <button onClick={() => setTab('support')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'support' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
              <HelpCircle className="w-5 h-5" /> Support Client
            </button>
            <button onClick={() => setTab('tontines')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'tontines' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
              <Users2 className="w-5 h-5" /> Tontine (Nat)
            </button>
            <button onClick={() => setTab('loans')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'loans' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
              <Landmark className="w-5 h-5" /> Micro-crédits
            </button>
            <button onClick={() => setTab('taxes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'taxes' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
              <Percent className="w-5 h-5" /> Moteur de Taxes
            </button>
            <button onClick={() => setTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${tab === 'settings' ? 'bg-white/10 text-noordrive-green' : 'text-gray-400 hover:bg-white/5'}`}>
              <Settings className="w-5 h-5" /> Paramètres
            </button>
          </div>
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

        {tab === 'liveops' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Map className="w-8 h-8 text-noordrive-green"/> Live Operations & Geofencing</h2>
              <div className="flex gap-2">
                <button className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-600 transition shadow-lg">⚡ Activer Surge Pricing Global</button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {/* Carte Principale */}
              <div className="col-span-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm min-h-[600px] flex flex-col relative overflow-hidden">
                <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-100">
                  <h3 className="font-bold text-sm mb-3">Filtres Carte</h3>
                  <div className="space-y-3 text-sm">
                     <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 accent-noordrive-green" /> Heatmap Demande</label>
                     <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 accent-noordrive-green" /> Chauffeurs Actifs (142)</label>
                     <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 accent-noordrive-green" /> Trajets en cours (38)</label>
                  </div>
                </div>
                <div className="flex-1 bg-[#e5e3df] rounded-xl border flex items-center justify-center relative">
                   {/* Fausse carte pour le visuel */}
                   <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                   <div className="relative z-10 text-center text-gray-600 bg-white/80 p-6 rounded-2xl backdrop-blur">
                     <Map className="w-16 h-16 mx-auto mb-4 text-noordrive-green" />
                     <p className="font-bold text-xl mb-2">God View Map</p>
                     <p className="text-sm">En attente de connexion au flux WebSocket GPS</p>
                   </div>
                </div>
              </div>

              {/* Panneau latéral Live */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500"/> Trajets en direct</h3>
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">En cours</span>
                           <span className="text-xs text-gray-400">Il y a 4 min</span>
                        </div>
                        <p className="text-sm font-bold truncate">Client {i} → Chauffeur {i}</p>
                        <p className="text-xs text-gray-500 truncate mt-1">Plateau → Almadies</p>
                      </div>
                    ))}
                    <button className="w-full py-2 text-center text-sm font-bold text-blue-500 hover:bg-blue-50 rounded-lg transition">Voir les 35 autres...</button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-yellow-500"/> Geofencing & Surge</h3>
                   <div className="space-y-4">
                      <div className="border p-4 rounded-xl bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm">Zone Aéroport</span>
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Actif</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Multiplicateur de prix actuel : <strong className="text-black">x1.5</strong></p>
                        <input type="range" min="1" max="3" step="0.1" defaultValue="1.5" className="w-full accent-noordrive-green" />
                      </div>
                      <button className="w-full border-2 border-dashed border-gray-300 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition">+ Créer une zone</button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'marketing' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Gift className="w-8 h-8 text-noordrive-green"/> Marketing & Promotions</h2>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Création de Code Promo */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Créer un Code Promo</h3>
                <form className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Code (ex: TABASKI26)</label>
                       <input type="text" className="w-full border p-3 rounded-xl focus:outline-none focus:border-noordrive-green" placeholder="TABASKI26" />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Type de Réduction</label>
                       <select className="w-full border p-3 rounded-xl focus:outline-none bg-white">
                         <option>Montant fixe (FCFA)</option>
                         <option>Pourcentage (%)</option>
                       </select>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Valeur</label>
                       <input type="number" className="w-full border p-3 rounded-xl focus:outline-none focus:border-noordrive-green" placeholder="1000" />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Limite d'utilisation (Nb max)</label>
                       <input type="number" className="w-full border p-3 rounded-xl focus:outline-none focus:border-noordrive-green" placeholder="100" />
                     </div>
                   </div>
                   <div className="flex items-center gap-2 mt-2">
                     <input type="checkbox" id="newUsersOnly" className="w-4 h-4 accent-noordrive-green" />
                     <label htmlFor="newUsersOnly" className="text-sm font-bold text-gray-600 cursor-pointer">Réservé aux nouveaux utilisateurs</label>
                   </div>
                   <button type="button" className="w-full bg-noordrive-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition mt-4 shadow-lg">Générer le Code</button>
                </form>
              </div>

              {/* Notifications Push */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Campagne Push Notification</h3>
                <form className="space-y-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Ciblage de l'audience</label>
                     <select className="w-full border p-3 rounded-xl focus:outline-none bg-white">
                       <option>Tous les Passagers</option>
                       <option>Tous les Chauffeurs</option>
                       <option>Chauffeurs inactifs depuis 3 jours</option>
                       <option>Passagers sans trajet depuis 1 mois</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Titre de la notification</label>
                     <input type="text" className="w-full border p-3 rounded-xl focus:outline-none focus:border-noordrive-green" placeholder="🚗 Réduction ce weekend !" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                     <textarea className="w-full border p-3 rounded-xl focus:outline-none focus:border-noordrive-green min-h-[100px]" placeholder="Profitez de 1000 FCFA offerts..."></textarea>
                   </div>
                   <button type="button" className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition shadow-lg flex justify-center items-center gap-2">
                      Envoyer la campagne Push
                   </button>
                </form>
              </div>
            </div>
            
            {/* Liste des codes actifs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8">
               <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">Codes Promo Actifs</div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b">
                     <tr>
                        <th className="p-4 font-semibold">Code</th>
                        <th className="p-4 font-semibold">Valeur</th>
                        <th className="p-4 font-semibold">Utilisations</th>
                        <th className="p-4 font-semibold">Cible</th>
                        <th className="p-4 font-semibold text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     <tr className="hover:bg-gray-50">
                        <td className="p-4 font-black text-noordrive-green">BIENVENUE</td>
                        <td className="p-4 font-bold">1000 FCFA</td>
                        <td className="p-4">12/100</td>
                        <td className="p-4"><span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Nouveaux</span></td>
                        <td className="p-4 text-right"><button className="text-red-500 font-bold hover:underline">Désactiver</button></td>
                     </tr>
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {tab === 'risk' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><ShieldAlert className="w-8 h-8 text-noordrive-green"/> Risques, Fraudes & Audit</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Alertes Fraudes */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-red-500" /> Alertes Fraude (Auto-détection)
                 </h3>
                 <div className="space-y-3">
                   <div className="p-3 border rounded-xl bg-red-50 border-red-100">
                      <div className="flex justify-between">
                        <span className="font-bold text-sm text-red-700">Auto-Parrainage suspect</span>
                        <span className="text-xs font-bold text-red-500">Urgent</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">Le chauffeur "Oumar T." a invité 5 passagers utilisant la même adresse IP.</p>
                      <div className="mt-2 flex gap-2">
                        <button className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Bloquer les comptes</button>
                        <button className="text-xs bg-white text-gray-500 border px-3 py-1 rounded">Ignorer</button>
                      </div>
                   </div>
                   <div className="p-3 border rounded-xl bg-yellow-50 border-yellow-100">
                      <div className="flex justify-between">
                        <span className="font-bold text-sm text-yellow-700">Annulations excessives</span>
                        <span className="text-xs font-bold text-yellow-600">Modéré</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">Le chauffeur "Seydou N." a annulé 3 courses après avoir pris le client aujourd'hui.</p>
                      <div className="mt-2 flex gap-2">
                        <button className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Avertir</button>
                      </div>
                   </div>
                 </div>
              </div>

              {/* Logs d'Audit Admin */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                 <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Audit Logs (Historique Backoffice)</h3>
                 <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                   {[
                     { admin: 'SuperAdmin', action: 'A crédité 5000F au chauffeur ID#102', time: 'Il y a 10 min' },
                     { admin: 'Modérateur', action: 'A banni temporairement le passager ID#45', time: 'Il y a 1h' },
                     { admin: 'Système', action: 'Désactivation automatique du Surge (Aéroport)', time: 'Il y a 2h' },
                     { admin: 'SuperAdmin', action: 'Création du code promo TABASKI26', time: 'Hier' },
                   ].map((log, idx) => (
                     <div key={idx} className="flex gap-3 text-sm border-b pb-2">
                       <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-300"></div>
                       <div>
                         <p className="font-bold text-gray-700">{log.admin} <span className="font-normal text-gray-500 ml-1">- {log.action}</span></p>
                         <p className="text-xs text-gray-400">{log.time}</p>
                       </div>
                     </div>
                   ))}
                 </div>
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

                      {/* Nouvelles fonctionnalités CRM */}
                      <div className="bg-gray-50 p-4 rounded-xl border mt-4">
                        <h5 className="font-bold text-gray-800 mb-4">Actions Avancées</h5>
                        <div className="space-y-3">
                          <button className="w-full flex justify-between items-center bg-white p-3 rounded-lg border hover:bg-gray-50 transition">
                             <span className="font-bold text-sm text-gray-700">Historique des Trajets</span>
                             <span className="text-gray-400 text-xs">14 trajets</span>
                          </button>
                          <button className="w-full flex justify-between items-center bg-white p-3 rounded-lg border hover:bg-gray-50 transition">
                             <span className="font-bold text-sm text-gray-700">Avis & Notes reçues</span>
                             <span className="text-yellow-500 font-bold text-xs">⭐ 4.8</span>
                          </button>
                          <button className="w-full flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-100 transition">
                             <span className="font-bold text-sm">Shadowban Temporaire</span>
                             <span className="text-xs">24h / 48h</span>
                          </button>
                        </div>
                      </div>

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

        {tab === 'dispatcher' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Headset className="w-8 h-8 text-noordrive-green" /> Dispatcher (Commandes Manuelles)</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">Nouvelle Course</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Téléphone du client</label>
                    <input type="text" placeholder="+221 77 000 00 00" className="w-full border p-2 rounded mt-1 bg-gray-50 focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Point de départ</label>
                    <input type="text" placeholder="Aéroport AIBD" className="w-full border p-2 rounded mt-1 bg-gray-50 focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Point d'arrivée</label>
                    <input type="text" placeholder="Plateau, Dakar" className="w-full border p-2 rounded mt-1 bg-gray-50 focus:bg-white focus:outline-none" />
                  </div>
                  <div className="pt-2 border-t mt-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assignation Forcée (Optionnel)</label>
                    <select className="w-full border p-2 rounded bg-white focus:outline-none">
                      <option>Automatique (Le plus proche)</option>
                      <option>ID #102 - Oumar T. (À 2min)</option>
                      <option>ID #88 - Seydou N. (À 5min)</option>
                    </select>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-xl flex justify-between items-center font-bold">
                    <span>Prix Estimé</span>
                    <span className="text-noordrive-green text-lg">15 000 F</span>
                  </div>
                  <button type="button" className="w-full bg-noordrive-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 shadow-lg mt-2 transition">Lancer la commande</button>
                </form>
              </div>
              <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 relative overflow-hidden min-h-[500px] flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 <div className="relative z-10 text-center text-gray-600 bg-white/90 p-6 rounded-2xl backdrop-blur border shadow-xl">
                   <Map className="w-16 h-16 mx-auto mb-4 text-noordrive-green" />
                   <p className="font-bold text-xl mb-2">Carte Dispatcher</p>
                   <p className="text-sm">Cliquez sur la carte pour définir les points de départ/arrivée.</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'fleet' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Building className="w-8 h-8 text-noordrive-green" /> Gestion des Flottes & B2B</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-xl">Propriétaires de Flotte (Fleet Partners)</h3>
                 <button className="bg-noordrive-green text-white px-4 py-2 rounded-lg font-bold hover:brightness-105 shadow transition">+ Nouveau Propriétaire</button>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                     <tr>
                        <th className="p-4 font-semibold">Propriétaire</th>
                        <th className="p-4 font-semibold">Véhicules Actifs</th>
                        <th className="p-4 font-semibold">Chauffeurs Locataires</th>
                        <th className="p-4 font-semibold">Revenus (Semaine)</th>
                        <th className="p-4 font-semibold text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     <tr className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-800">Entreprise SN Express</td>
                        <td className="p-4">12 voitures</td>
                        <td className="p-4">15 chauffeurs</td>
                        <td className="p-4 font-bold text-noordrive-green">450 000 F</td>
                        <td className="p-4 text-right"><button className="text-blue-500 font-bold hover:underline">Gérer</button></td>
                     </tr>
                     <tr className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-800">Alioune Fall</td>
                        <td className="p-4">3 voitures</td>
                        <td className="p-4">3 chauffeurs</td>
                        <td className="p-4 font-bold text-noordrive-green">85 000 F</td>
                        <td className="p-4 text-right"><button className="text-blue-500 font-bold hover:underline">Gérer</button></td>
                     </tr>
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {tab === 'sos' && (
          <div className="space-y-6">
            <div className="bg-red-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><AlertTriangle className="w-64 h-64" /></div>
               <h2 className="text-4xl font-black mb-2 relative z-10 flex items-center gap-3"><AlertTriangle className="w-10 h-10" /> Centre d'Urgences SOS</h2>
               <p className="text-red-100 font-medium relative z-10 text-lg">Monitoring en temps réel des alertes de sécurité des utilisateurs et chauffeurs.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-red-100">
                  <h3 className="font-bold text-xl text-red-600 mb-4 flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div> Alertes Actives (1)</h3>
                  <div className="border border-red-200 bg-red-50 p-4 rounded-xl">
                     <div className="flex justify-between items-start mb-2">
                       <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">SOS Déclenché</span>
                       <span className="text-red-500 text-xs font-bold">Il y a 2 min</span>
                     </div>
                     <p className="font-bold text-gray-800">Passagère: Aissatou D.</p>
                     <p className="text-sm text-gray-700">Chauffeur: Moussa S. (Toyota Corolla - DK 1234 A)</p>
                     <p className="text-sm text-gray-700 mt-2">Dernière position GPS: VDN, Mermoz</p>
                     
                     <div className="grid grid-cols-2 gap-2 mt-4">
                       <button className="bg-white border-2 border-red-200 text-red-600 font-bold py-2 rounded-lg hover:bg-red-100 flex justify-center items-center gap-2 transition">🎧 Écouter Micro</button>
                       <button className="bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 flex justify-center items-center gap-2 transition shadow-lg">🚓 Contacter Police</button>
                     </div>
                  </div>
               </div>
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg text-gray-800 mb-4">Historique des Incidents</h3>
                  <div className="space-y-3">
                     <div className="p-3 border rounded-xl flex justify-between items-center opacity-70">
                       <div>
                         <p className="font-bold text-sm text-gray-800">Dispute Tarifaire</p>
                         <p className="text-xs text-gray-500">Hier - Chauffeur ID #45</p>
                       </div>
                       <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded">Résolu</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {tab === 'loyalty' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Trophy className="w-8 h-8 text-yellow-500" /> Gamification & VIP</h2>
            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-yellow-400">
                  <h3 className="font-bold text-xl mb-4 text-gray-800">Passagers VIP (NoorDrive Gold)</h3>
                  <p className="text-sm text-gray-600 mb-4">Clients ayant effectué plus de 50 courses ce mois-ci.</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold">1</div>
                        <span className="font-bold text-gray-800">Cheikh Fall</span>
                      </div>
                      <span className="text-sm text-gray-500">62 courses</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold">2</div>
                        <span className="font-bold text-gray-800">Fatou Ndiaye</span>
                      </div>
                      <span className="text-sm text-gray-500">58 courses</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-yellow-50 text-yellow-700 font-bold py-2 rounded-lg hover:bg-yellow-100 transition">Configurer les avantages VIP</button>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-blue-500">
                  <h3 className="font-bold text-xl mb-4 text-gray-800">Quêtes Chauffeurs</h3>
                  <div className="p-4 border rounded-xl mb-4">
                     <div className="flex justify-between items-center mb-2">
                       <span className="font-bold text-blue-600">Challenge du Weekend</span>
                       <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">Actif</span>
                     </div>
                     <p className="text-sm mb-3 text-gray-700">Réaliser 20 courses entre Vendredi 18h et Dimanche 23h pour débloquer un bonus de 10 000 FCFA.</p>
                     <div className="w-full bg-gray-100 h-2 rounded-full mb-1"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div></div>
                     <p className="text-xs text-right text-gray-500">45 chauffeurs ont complété (450 000 F provisionnés)</p>
                  </div>
                  <button className="w-full border-2 border-dashed border-gray-300 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition">+ Créer une nouvelle quête</button>
               </div>
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
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Gestion des Micro-crédits</h2>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <tr>
                    <th className="p-4 font-semibold">Chauffeur</th>
                    <th className="p-4 font-semibold">Montant</th>
                    <th className="p-4 font-semibold">Motif & Durée</th>
                    <th className="p-4 font-semibold">Remboursé</th>
                    <th className="p-4 font-semibold">Statut</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loans.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">Aucune demande de prêt</td></tr>}
                  {loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <p className="font-bold">{loan.driver?.name}</p>
                        <p className="text-xs text-gray-500">{loan.driver?.phone}</p>
                      </td>
                      <td className="p-4 font-black">{formatFcfa(loan.montant)}</td>
                      <td className="p-4">
                        <p className="font-medium text-sm">{loan.motif}</p>
                        <p className="text-xs text-gray-500">{loan.dureeMois} mois ({formatFcfa(loan.mensualite)}/mois)</p>
                      </td>
                      <td className="p-4">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1 max-w-[100px]">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${(loan.montantRembourse / loan.montant)*100}%`}}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{formatFcfa(loan.montantRembourse)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold capitalize ${
                          loan.status === 'en_attente' ? 'bg-orange-100 text-orange-600' :
                          loan.status === 'en_cours' ? 'bg-blue-100 text-blue-600' :
                          loan.status === 'rembourse' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {loan.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        {loan.status === 'en_attente' && (
                          <>
                            <button onClick={() => handleApproveLoan(loan.id)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition" title="Valider">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRejectLoan(loan.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Refuser">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'support' && (
          <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Support Client & Tickets</h2>
            
            <div className="flex flex-1 gap-6 min-h-[500px]">
              {/* List */}
              <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto">
                <div className="p-4 border-b font-bold sticky top-0 bg-white">Tickets récents</div>
                <div className="divide-y">
                  {tickets.length === 0 && <p className="p-8 text-center text-gray-500 text-sm">Aucun ticket</p>}
                  {tickets.map(t => (
                    <button key={t.id} onClick={() => loadTicket(t.id)} className={`w-full text-left p-4 hover:bg-gray-50 transition ${activeTicket?.id === t.id ? 'bg-blue-50' : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-sm text-gray-800 line-clamp-1">{t.subject}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${t.status==='OPEN' ? 'bg-red-100 text-red-600' : t.status==='IN_PROGRESS' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{t.user?.name} ({t.user?.phone})</p>
                      <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat View */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                {activeTicket ? (
                  <>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{activeTicket.subject}</h3>
                        <p className="text-sm text-gray-500">Client: {activeTicket.user?.name} ({activeTicket.user?.phone})</p>
                      </div>
                      {activeTicket.status !== 'RESOLVED' && activeTicket.status !== 'CLOSED' && (
                        <button onClick={() => handleResolveTicket(activeTicket.id)} className="bg-green-100 text-green-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-200">
                          Marquer Résolu
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                      {activeTicket.messages?.map((m: any) => (
                        <div key={m.id} className={`flex ${m.isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-2xl ${m.isAdmin ? 'bg-noordrive-green text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}`}>
                            <p className="text-sm">{m.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${m.isAdmin ? 'text-white/70' : 'text-gray-400'}`}>
                              {new Date(m.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(activeTicket.status !== 'RESOLVED' && activeTicket.status !== 'CLOSED') && (
                      <form onSubmit={handleReplyTicket} className="p-4 border-t border-gray-100 flex gap-2">
                        <input type="text" value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Votre réponse..." className="flex-1 bg-gray-100 rounded-xl px-4 outline-none" />
                        <button type="submit" disabled={!replyText.trim()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">Envoyer</button>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>Sélectionnez un ticket pour afficher la conversation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><BarChart2 className="w-8 h-8 text-noordrive-green" /> Data Intelligence & Export</h2>
              <button onClick={() => {
                const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
                  Date: new Date(t.createdAt).toLocaleDateString(),
                  Référence: t.reference,
                  Type: t.type,
                  Montant: t.amount,
                  Méthode: t.method,
                  Description: t.description
                })));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Transactions");
                XLSX.writeFile(wb, `NoorDrive_Compta_${new Date().toISOString().split('T')[0]}.xlsx`);
              }} className="bg-noordrive-green text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:brightness-105 shadow-lg">
                <FileSpreadsheet className="w-5 h-5" /> Exporter Data (Excel)
              </button>
            </div>
            
            {/* Nouveau Dashboard Data Intelligence */}
            <div className="grid grid-cols-3 gap-6">
               <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
                 <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Taux de Conversion (Funnel Acquisition)</h3>
                 <div className="flex h-[250px] items-end justify-around pb-4 pt-8">
                    <div className="w-24 bg-blue-100 flex flex-col justify-end items-center rounded-t-xl group relative" style={{ height: '100%' }}>
                      <span className="absolute -top-6 font-bold text-blue-600">100%</span>
                      <div className="w-full bg-blue-500 rounded-t-xl" style={{ height: '100%' }}></div>
                      <span className="absolute -bottom-6 text-xs font-bold text-gray-500">Ouverture App</span>
                    </div>
                    <div className="w-24 bg-blue-100 flex flex-col justify-end items-center rounded-t-xl relative" style={{ height: '100%' }}>
                      <span className="absolute -top-6 font-bold text-blue-600">65%</span>
                      <div className="w-full bg-blue-500 rounded-t-xl" style={{ height: '65%' }}></div>
                      <span className="absolute -bottom-6 text-xs font-bold text-gray-500">Recherche</span>
                    </div>
                    <div className="w-24 bg-blue-100 flex flex-col justify-end items-center rounded-t-xl relative" style={{ height: '100%' }}>
                      <span className="absolute -top-6 font-bold text-blue-600">42%</span>
                      <div className="w-full bg-blue-500 rounded-t-xl" style={{ height: '42%' }}></div>
                      <span className="absolute -bottom-6 text-xs font-bold text-gray-500">Match Chauffeur</span>
                    </div>
                    <div className="w-24 bg-blue-100 flex flex-col justify-end items-center rounded-t-xl relative" style={{ height: '100%' }}>
                      <span className="absolute -top-6 font-bold text-noordrive-green">38%</span>
                      <div className="w-full bg-noordrive-green rounded-t-xl" style={{ height: '38%' }}></div>
                      <span className="absolute -bottom-6 text-xs font-bold text-gray-500">Course Terminée</span>
                    </div>
                 </div>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
                 <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Rétention Cohortes (S+1)</h3>
                 <div className="space-y-4 mt-8">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="font-bold text-gray-600">Passagers (Revenus après 7 jours)</span> <span className="font-bold">45%</span></div>
                      <div className="w-full bg-gray-100 h-3 rounded-full"><div className="bg-blue-500 h-3 rounded-full" style={{ width: '45%' }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="font-bold text-gray-600">Chauffeurs (Actifs après 7 jours)</span> <span className="font-bold">82%</span></div>
                      <div className="w-full bg-gray-100 h-3 rounded-full"><div className="bg-noordrive-green h-3 rounded-full" style={{ width: '82%' }}></div></div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[300px]">
                <h3 className="font-bold text-gray-800 mb-4">Volume des Transactions Financières</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={transactions.slice(0,10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#0a8f4c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[300px]">
                <h3 className="font-bold text-gray-800 mb-4">Évolution des Micro-Crédits</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={loans.slice(0,10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dureeMois" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="montant" stroke="#8884d8" />
                    <Line type="monotone" dataKey="montantRembourse" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === 'tontines' && (
          <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Groupes de Tontine (Nat)</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <h3 className="font-bold text-xl mb-4">Créer un nouveau groupe</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                await api.post('/tontine/groups', Object.fromEntries(formData));
                fetchTontines();
              }} className="flex gap-4">
                <input name="name" placeholder="Nom du groupe" className="flex-1 px-4 py-2 bg-gray-50 border rounded-xl" required />
                <input name="amountPerPeriod" type="number" placeholder="Cotisation (FCFA)" className="w-48 px-4 py-2 bg-gray-50 border rounded-xl" required />
                <select name="frequency" className="w-48 px-4 py-2 bg-gray-50 border rounded-xl">
                  <option value="DAILY">Quotidien</option>
                  <option value="WEEKLY">Hebdomadaire</option>
                </select>
                <input name="maxMembers" type="number" placeholder="Membres max" className="w-32 px-4 py-2 bg-gray-50 border rounded-xl" required />
                <button className="bg-noordrive-green text-white px-6 py-2 rounded-xl font-bold">Créer</button>
              </form>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {tontines.map(t => (
                <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{t.name}</h3>
                      <p className="text-gray-500">{formatFcfa(t.amountPerPeriod)} / {t.frequency === 'DAILY' ? 'Jour' : 'Semaine'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Membres: {t.members.length}/{t.maxMembers}</span>
                    <span className="text-gray-500">Tour actuel: {t.currentTurnIndex}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-noordrive-green h-2 rounded-full" style={{ width: `${(t.cagnotte / (t.amountPerPeriod * t.maxMembers)) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-right mt-1 text-gray-500">Cagnotte: {formatFcfa(t.cagnotte)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
