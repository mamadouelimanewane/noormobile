import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === 'admin') {
      setIsAdmin(true);
      fetchPendingDrivers();
    }
  }

  async function fetchPendingDrivers() {
    try {
      const res = await axios.get(`${API_URL}/admin/pending-drivers`);
      setPendingDrivers(res.data.users);
    } catch (err) {
      console.error(err);
    }
  }

  async function approveDriver(driverId: string) {
    try {
      await axios.post(`${API_URL}/admin/approve-driver`, { driverId });
      fetchPendingDrivers();
    } catch (err) {
      console.error(err);
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f4f6f5] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <ShieldCheck className="w-12 h-12 text-noordrive-black" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">NOORDRIVE Admin</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full border rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-noordrive-black outline-none"
          />
          <button type="submit" className="w-full bg-noordrive-black text-white font-bold py-3 rounded-lg">
            Connexion
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f5]">
      <header className="bg-noordrive-black text-white p-4 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="text-noordrive-green">●</span> NOORDRIVE Backoffice
          </div>
          <button onClick={() => setIsAdmin(false)} className="text-sm text-gray-300 hover:text-white">Déconnexion</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <UserCheck className="w-6 h-6" /> Validation des Chauffeurs
        </h2>
        
        {pendingDrivers.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border text-center text-gray-500">
            Aucun chauffeur en attente de validation.
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingDrivers.map(driver => (
              <div key={driver.id} className="bg-white border rounded-xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-lg">{driver.name}</h3>
                  <p className="text-sm text-gray-600">Téléphone: {driver.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Véhicule: {driver.vehicle?.marque} {driver.vehicle?.modele} ({driver.vehicle?.plaque})
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveDriver(driver.id)} className="flex items-center gap-1 bg-noordrive-green text-white px-4 py-2 rounded-lg font-medium hover:bg-noordrive-green-dark transition">
                    <CheckCircle className="w-4 h-4" /> Approuver
                  </button>
                  <button className="flex items-center gap-1 bg-gray-100 text-noordrive-red px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition">
                    <XCircle className="w-4 h-4" /> Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
