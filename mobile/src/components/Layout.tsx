import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatFcfa } from '../lib/geo';

interface LayoutProps {
  children: ReactNode;
  tabs?: { key: string; label: string }[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export default function Layout({ children, tabs, activeTab, onTabChange }: LayoutProps) {
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const passengers = useStore((s) => s.passengers);
  const drivers = useStore((s) => s.drivers);
  const navigate = useNavigate();

  const wallet =
    currentUser?.role === 'passager'
      ? passengers[currentUser.id]?.walletBalance
      : currentUser?.role === 'chauffeur'
      ? drivers[currentUser.id]?.walletBalance
      : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f5]">
      <header className="bg-noordrive-black text-white sticky top-0 z-[1000]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="text-noordrive-green">●</span> NOORDRIVE
          </div>
          <div className="flex items-center gap-4 text-sm">
            {wallet !== undefined && (
              <span className="bg-white/10 px-3 py-1 rounded-full">{formatFcfa(wallet)}</span>
            )}
            {currentUser && (
              <>
                <span className="hidden sm:inline text-white/70">{currentUser.name}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition"
                >
                  Déconnexion
                </button>
              </>
            )}
          </div>
        </div>
        {tabs && (
          <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => onTabChange?.(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  activeTab === t.key
                    ? 'border-noordrive-green text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
