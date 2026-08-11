import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Map as MapIcon, LogOut } from 'lucide-react';

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();

  const links = [
    { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/map', label: 'Carte en direct', icon: MapIcon },
    { path: '/validation', label: 'Validation Chauffeurs', icon: FileCheck },
  ];

  return (
    <div className="w-64 h-screen bg-noordrive-black text-white flex flex-col fixed left-0 top-0 shadow-2xl z-50">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <span className="text-noordrive-green">●</span> NOORDRIVE
        </h1>
        <p className="text-gray-400 text-[10px] mt-1 font-bold tracking-widest uppercase">Admin Backoffice</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                isActive ? 'bg-noordrive-green text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 w-full rounded-xl transition hover:bg-white/10 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
