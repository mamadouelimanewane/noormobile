import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-noordrive-black text-white">
      <header className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="text-noordrive-green">●</span> NOORDRIVE
        </div>
        <Link
          to="/connexion"
          className="bg-noordrive-green hover:bg-noordrive-green-dark transition px-5 py-2 rounded-full font-semibold text-sm"
        >
          Se connecter
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-10 pb-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Le prix que <span className="text-noordrive-green">vous deux</span>
          <br />
          acceptez pour votre trajet
        </h1>
        <p className="text-white/60 max-w-xl mx-auto mb-8 text-lg">
          NOORDRIVE connecte passagers et chauffeurs à Dakar autour d'un principe simple : c'est vous qui
          négociez le tarif, pas une application.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/connexion?role=passager"
            className="bg-noordrive-green hover:bg-noordrive-green-dark transition px-6 py-3 rounded-full font-semibold"
          >
            Je suis passager
          </Link>
          <Link
            to="/connexion?role=chauffeur"
            className="bg-noordrive-gold text-noordrive-black hover:brightness-95 transition px-6 py-3 rounded-full font-semibold"
          >
            Je suis chauffeur
          </Link>
        </div>
      </section>

      <section className="bg-white text-noordrive-black rounded-t-[40px] px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Nos services</h2>
          <p className="text-center text-gray-500 mb-10">Un seul principe : le juste prix, décidé ensemble.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-noordrive-green">100%</div>
              <div className="text-sm text-gray-500">tarifs négociés, sans surprise</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-noordrive-green">14</div>
              <div className="text-sm text-gray-500">quartiers de Dakar couverts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-noordrive-green">8</div>
              <div className="text-sm text-gray-500">villes en intercity</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white text-center text-xs text-gray-400 pb-8">
        NOORDRIVE est un agrégateur en ligne. Nous ne participons pas à la coopération entre nos utilisateurs.
        <br />
        © {new Date().getFullYear()} NOORDRIVE — Dakar, Sénégal
      </footer>
    </div>
  );
}
