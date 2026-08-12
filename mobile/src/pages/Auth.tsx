import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Role } from '../types';

const VEHICULES = [
  ['Toyota', 'Corolla'],
  ['Hyundai', 'Accent'],
  ['Kia', 'Rio'],
  ['Dacia', 'Sandero'],
  ['Suzuki', 'Alto'],
];

export default function Auth() {
  const [params] = useSearchParams();
  const initialRole = (params.get('role') as Role) || 'passager';
  const [role, setRole] = useState<Role>(initialRole);
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [marque, setMarque] = useState(VEHICULES[0][0]);
  const [modele, setModele] = useState(VEHICULES[0][1]);
  const [plaque, setPlaque] = useState('');
  const [couleur, setCouleur] = useState('Blanche');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');

  const currentUser = useStore((s) => s.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'admin' ? '/admin' : currentUser.role === 'chauffeur' ? '/chauffeur' : '/passager');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const autoPhone = params.get('phone');
    if (autoPhone) {
      import('../lib/api').then(({ api }) => {
        api.post('/auth/login', { phone: autoPhone, role: initialRole })
          .then(res => {
            if (res.data.ok) {
              if ('setCurrentUser' in useStore.getState()) {
                (useStore.getState() as any).setCurrentUser(res.data.user);
              } else {
                (useStore.getState() as any).login(autoPhone, initialRole);
              }
              navigate(initialRole === 'admin' ? '/admin' : initialRole === 'passager' ? '/passager' : '/chauffeur');
            }
          });
      });
    }
  }, [params, initialRole, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      return setError('L\'accès administrateur a été déplacé vers le portail dédié.');
    }

    try {
      const { api } = await import('../lib/api');
      const payload = mode === 'connexion' 
        ? { phone, role } 
        : { phone, role, name, referralCode: referralCode.trim() || undefined, vehicle: role === 'chauffeur' ? { marque, modele, plaque: plaque || 'DK 1234 AB', couleur } : undefined };
      
      const res = await api.post('/auth/login', payload);
      if (res.data.ok) {
        if ('setCurrentUser' in useStore.getState()) {
          (useStore.getState() as any).setCurrentUser(res.data.user);
        } else {
          mode === 'connexion' ? (useStore.getState() as any).login(phone, role) : (useStore.getState() as any).register(name, phone, role, payload.vehicle);
        }
        navigate(role === 'passager' ? '/passager' : '/chauffeur');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Erreur de connexion';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <Link to="/" className="flex justify-center mb-8">
          <img src="/logo.png" alt="NOORDRIVER" className="h-12 object-contain" />
        </Link>

        <div className="flex bg-gray-100 rounded-full p-1 mb-6">
          {(['passager', 'chauffeur'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-full transition capitalize ${
                role === r ? 'bg-noordrive-black text-white' : 'text-gray-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {role !== 'admin' && (
          <div className="flex gap-4 mb-6 text-sm">
            <button
              onClick={() => setMode('connexion')}
              className={`font-medium pb-1 border-b-2 ${mode === 'connexion' ? 'border-noordrive-green text-noordrive-black' : 'border-transparent text-gray-400'}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('inscription')}
              className={`font-medium pb-1 border-b-2 ${mode === 'inscription' ? 'border-noordrive-green text-noordrive-black' : 'border-transparent text-gray-400'}`}
            >
              Inscription
            </button>
          </div>
        )}

        {role === 'admin' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">Accès administrateur de la plateforme NOORDRIVE.</p>
            <button type="submit" className="w-full bg-noordrive-black text-white py-3 rounded-full font-semibold">
              Entrer dans le dashboard admin
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'inscription' && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-500">Nom complet</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    placeholder="Ex : Fatou Diop"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Code de parrainage (Optionnel)</label>
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full border rounded-lg px-3 py-2 mt-1 uppercase"
                    placeholder="NOOR-XXXXXX"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500">Numéro de téléphone</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1"
                placeholder="77 123 45 67"
              />
            </div>

            {mode === 'inscription' && role === 'chauffeur' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Marque</label>
                  <select value={marque} onChange={(e) => setMarque(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1">
                    {VEHICULES.map(([m]) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Modèle</label>
                  <input value={modele} onChange={(e) => setModele(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Plaque</label>
                  <input value={plaque} onChange={(e) => setPlaque(e.target.value)} placeholder="DK 1234 AB" className="w-full border rounded-lg px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Couleur</label>
                  <input value={couleur} onChange={(e) => setCouleur(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
                </div>
              </div>
            )}

            {error && <p className="text-noordrive-red text-sm">{error}</p>}

            <button type="submit" className="w-full bg-noordrive-green hover:bg-noordrive-green-dark transition text-white py-3 rounded-full font-semibold">
              {mode === 'connexion' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
