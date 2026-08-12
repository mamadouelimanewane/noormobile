import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [variant, setVariant] = useState(1); // 1, 2, ou 3

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'admin' ? '/admin' : currentUser.role === 'chauffeur' ? '/chauffeur' : '/passager');
    }
  }, [currentUser, navigate]);

  return (
    <>
      <AnimatePresence mode="wait">
        {variant === 1 && <Variant1 key="v1" />}
        {variant === 2 && <Variant2 key="v2" />}
        {variant === 3 && <Variant3 key="v3" />}
      </AnimatePresence>

      {/* Floating Selector (Dev/Demo Only) */}
      <div className="fixed bottom-6 right-6 z-50 bg-white/90 backdrop-blur-md border border-gray-200 p-2 rounded-2xl shadow-2xl flex gap-2">
        {[1, 2, 3].map(v => (
          <button 
            key={v}
            onClick={() => setVariant(v)}
            className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all ${variant === v ? 'bg-noordrive-green text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {v}
          </button>
        ))}
      </div>
    </>
  );
}

// ----------------------------------------------------
// VARIANTE 1 : DARK & SLEEK
// ----------------------------------------------------
function Variant1() {
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

// ----------------------------------------------------
// VARIANTE 2 : SPLIT LAYOUT
// ----------------------------------------------------
function Variant2() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white text-black flex flex-col md:flex-row overflow-hidden">
      {/* Left Side : Black & Branding */}
      <div className="w-full md:w-5/12 bg-black min-h-[50vh] md:min-h-screen p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative Green Circle */}
        <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-[#2ed573] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        
        <div className="relative z-10">
          <img src="/logo.png" alt="NoorDriver" className="h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>

        <div className="relative z-10 my-16 md:my-0">
          <h1 className="text-white text-5xl md:text-6xl font-black leading-[1.1] mb-6">
            Prenez le <br /> <span className="text-[#2ed573]">volant</span> de <br /> vos prix.
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-light mb-10">
            Fini les prix imposés. Négociez directement et partez avec le sourire.
          </p>
          <div className="flex flex-col gap-4 max-w-sm">
            <Link to="/connexion?role=passager" className="bg-[#2ed573] text-black w-full text-center px-6 py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors">
              Passager
            </Link>
            <Link to="/connexion?role=chauffeur" className="bg-transparent border-2 border-white text-white w-full text-center px-6 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-black transition-colors">
              Chauffeur
            </Link>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-600 uppercase tracking-widest">
          © {new Date().getFullYear()} NOORDRIVER DAKAR
        </div>
      </div>

      {/* Right Side : White & Features */}
      <div className="w-full md:w-7/12 bg-gray-50 min-h-[50vh] md:min-h-screen p-8 md:p-16 flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-10 text-black">Tout ce dont vous avez besoin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4 bg-gray-50 w-16 h-16 flex items-center justify-center rounded-xl">{s.icon}</div>
              <h3 className="font-bold text-xl mb-2 text-black">{s.title}</h3>
              <p className="text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------
// VARIANTE 3 : GLASSMORPHISM & NEON
// ----------------------------------------------------
function Variant3() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      
      {/* Animated Glowing Orbs */}
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#2ed573] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none" />

      <div className="relative z-10">
        <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center md:justify-between">
          <img src="/logo.png" alt="NoorDriver" className="h-14 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <Link to="/connexion" className="hidden md:block bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition px-6 py-2 rounded-full font-medium text-sm">
            Espace Membre
          </Link>
        </header>

        <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-block bg-[#2ed573]/10 border border-[#2ed573]/20 text-[#2ed573] px-4 py-1.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
            ✨ La nouvelle façon de se déplacer
          </div>
          <h1 className="text-5xl md:text-8xl font-black leading-[1.05] tracking-tight mb-8">
            Le juste prix. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2ed573] to-emerald-400">À chaque course.</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg md:text-xl">
            Découvrez une application où le passager et le chauffeur s'accordent librement sur le tarif.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center max-w-lg mx-auto">
            <Link to="/connexion?role=passager" className="flex-1 bg-gradient-to-r from-[#2ed573] to-emerald-500 hover:from-emerald-400 hover:to-emerald-600 text-black px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-emerald-500/30 transition-all">
              Commander
            </Link>
            <Link to="/connexion?role=chauffeur" className="flex-1 bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all">
              Conduire
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-[#2ed573]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-4xl mb-6 relative z-10">{s.icon}</div>
                <h3 className="font-bold text-xl mb-3 text-white relative z-10">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed relative z-10">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
