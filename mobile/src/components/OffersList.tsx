import type { Offer } from '../types';
import { formatFcfa } from '../lib/geo';

interface OffersListProps {
  offers: Offer[];
  onAccept: (offerId: string) => void;
}

export default function OffersList({ offers, onAccept }: OffersListProps) {
  const active = offers.filter((o) => o.status === 'en_attente').sort((a, b) => a.price - b.price);

  if (active.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <div className="animate-pulse">Recherche de chauffeurs à proximité...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{active.length} offre(s) reçue(s) — choisissez celle qui vous convient.</p>
      {active.map((o) => (
        <div key={o.id} className="border rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold">{o.driverName}</div>
            <div className="text-xs text-gray-500">
              {o.vehicle} · ★ {o.driverRating.toFixed(1)} · arrivée en {o.etaMin} min
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-noordrive-green text-lg">{formatFcfa(o.price)}</div>
            <button
              onClick={() => onAccept(o.id)}
              className="mt-1 bg-noordrive-black text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-black transition"
            >
              Accepter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
