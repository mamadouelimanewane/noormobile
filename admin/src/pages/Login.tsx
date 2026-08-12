import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Login() {
  const [phone, setPhone] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone === 'admin' && password === 'admin') {
      // Pour le développement
      if ('setCurrentUser' in useStore.getState()) {
        (useStore.getState() as any).setCurrentUser({ id: 'admin', role: 'admin', name: 'Admin', phone: 'admin' });
      }
      navigate('/dashboard');
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <span className="text-noordrive-green">●</span> NOORDRIVE ADMIN
          </h1>
          <p className="text-gray-500 mt-2">Connectez-vous au panneau de contrôle</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant Administrateur</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-noordrive-black"
              placeholder="Ex: admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-noordrive-black"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-noordrive-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition shadow-lg shadow-gray-200 mt-6"
          >
            Accéder au Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
