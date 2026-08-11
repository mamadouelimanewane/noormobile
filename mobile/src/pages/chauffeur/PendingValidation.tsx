import { Clock } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function PendingValidation() {
  const logout = useStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-[#f4f6f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <Clock className="w-16 h-16 text-noordrive-gold animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Compte en attente de validation</h1>
        <p className="text-gray-600 mb-8">
          Votre compte chauffeur a bien été créé, mais il doit être validé par un administrateur avant que vous puissiez commencer à recevoir des courses.
        </p>
        <button
          onClick={logout}
          className="w-full bg-noordrive-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
