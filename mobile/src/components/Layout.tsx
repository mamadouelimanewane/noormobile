import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatFcfa } from '../lib/geo';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Map, Wallet, Clock, LogOut, Gift } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const passengers = useStore((s) => s.passengers);
  const drivers = useStore((s) => s.drivers);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const wallet =
    currentUser?.role === 'passager'
      ? passengers[currentUser.id]?.walletBalance
      : currentUser?.role === 'chauffeur'
      ? drivers[currentUser.id]?.walletBalance
      : undefined;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden relative">
      {/* Floating Hamburger Button */}
      <button 
        onClick={() => setMenuOpen(true)}
        className="absolute top-4 left-4 z-40 bg-white p-3 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition"
      >
        <Menu className="w-6 h-6 text-noordrive-black" />
      </button>

      {/* Main Content (Map takes full screen) */}
      <main className="flex-1 w-full relative z-0">{children}</main>

      {/* Sidebar Drawer overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 h-full w-80 max-w-[85%] bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="bg-noordrive-black text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-16 h-16 rounded-full border-2 border-white/20 bg-gray-800 flex items-center justify-center text-2xl font-bold">
                    {currentUser?.name?.[0] || 'U'}
                  </div>
                  <button onClick={() => setMenuOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-xl font-bold">{currentUser?.name}</h2>
                <div className="text-noordrive-green font-medium text-sm mt-1">{currentUser?.role === 'chauffeur' ? 'Chauffeur Partenaire' : 'Passager'}</div>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                  <button onClick={() => { onTabChange?.('demandes'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'demandes' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Map className="w-5 h-5" /> Carte & Réservation (VTC)
                  </button>
                  <button onClick={() => { onTabChange?.('covoiturage'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'covoiturage' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Map className="w-5 h-5 text-blue-500" /> Covoiturage (Ville en ville)
                  </button>
                  <button onClick={() => { onTabChange?.('historique'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'historique' || activeTab === 'courses' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Clock className="w-5 h-5" /> Historique de courses
                  </button>
                  {currentUser?.role === 'chauffeur' && (
                    <button onClick={() => { onTabChange?.('revenus'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'revenus' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <Wallet className="w-5 h-5" /> Mes Revenus
                    </button>
                  )}
                  <button onClick={() => { onTabChange?.('portefeuille'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'portefeuille' || activeTab === 'money' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Wallet className="w-5 h-5" /> Portefeuille ({formatFcfa(wallet || 0)})
                  </button>
                  <button onClick={() => { onTabChange?.('parrainage'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'parrainage' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Gift className="w-5 h-5 text-noordrive-green" /> Parrainage
                  </button>
                </nav>
              </div>

              <div className="p-4 border-t">
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition"
                >
                  <LogOut className="w-5 h-5" /> Déconnexion
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
