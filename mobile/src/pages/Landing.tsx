import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

const SERVICES = [
  {
    icon: '🚗',
    title: 'Trajets en ville',
    desc: 'Proposez votre prix, les chauffeurs répondent. Vous choisissez.',
  },
  {
    icon: '📦',
    title: 'Livraison',
    desc: 'Envoyez un colis à Dakar au prix que vous négociez avec le livreur.',
  },
  {
    icon: '🛣️',
    title: 'Ville à ville',
    desc: 'Dakar, Thiès, Saint-Louis, Touba... voyagez entre villes en toute confiance.',
  },
  {
    icon: '💰',
    title: 'NOORDRIVE.Money',
    desc: 'Un micro-crédit pour les chauffeurs afin de rouler plus librement.',
  },
];

export default function Landing() {
  const currentUser = useStore((s) => s.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'admin' ? '/admin' : currentUser.role === 'chauffeur' ? '/chauffeur' : '/passager');
    }
  }, [currentUser, navigate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-black text-white selection:bg-noordrive-green selection:text-black">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex-shrink-0">
          <img src="/logo.png" alt="NoorDriver" className="h-10 md:h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          {/* Fallback si logo non trouvé */}
          <span className="sr-only">NOORDRIVER</span>
        </div>
        <Link to="/connexion" className="bg-white/10 hover:bg-white/20 border border-white/20 transition px-6 py-2.5 rounded-full font-semibold text-sm">
          Connexion
        </Link>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-8">
          Le prix que <span className="text-[#2ed573]">vous deux</span>
          <br />
          acceptez pour votre trajet.
        </motion.h1>
        <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-400 max-w-2xl mx-auto mb-12 text-xl font-light">
          NOORDRIVE connecte passagers et chauffeurs à Dakar autour d'un principe simple : c'est vous qui négociez le tarif. Sans algorithme caché.
        </motion.p>
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/connexion?role=passager" className="bg-[#2ed573] hover:bg-[#26b461] text-black transition-all px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(46,213,115,0.4)] hover:scale-105">
            Devenir Passager
          </Link>
          <Link to="/connexion?role=chauffeur" className="bg-white hover:bg-gray-100 text-black transition-all px-8 py-4 rounded-full font-bold text-lg hover:scale-105">
            Devenir Chauffeur
          </Link>
        </motion.div>
      </section>

      <section className="bg-zinc-900 border-t border-zinc-800 rounded-t-[50px] px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={s.title} className="bg-black border border-zinc-800 rounded-3xl p-8 hover:border-[#2ed573] transition-colors group">
                <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{s.icon}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
