import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === 'admin') {
      onLogin();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f6f5] to-gray-200 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-10 h-10 text-noordrive-black" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-center mb-2">NOORDRIVE</h1>
        <p className="text-center text-gray-500 mb-8 font-medium">Administration Premium</p>
        
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe (admin)"
          className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 mb-6 focus:ring-4 focus:ring-noordrive-green/20 focus:border-noordrive-green outline-none transition"
        />
        <button type="submit" className="w-full bg-noordrive-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition shadow-lg">
          Connexion Sécurisée
        </button>
      </form>
    </div>
  );
}
