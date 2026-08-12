import { useState } from 'react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { VILLES_INTERCITY } from '../types';
import { Search, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { formatFcfa } from '../lib/geo';

export default function PassengerCarpool() {
  const currentUser = useStore(s => s.currentUser);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  
  const [search, setSearch] = useState({
    villeDepart: 'Dakar',
    villeArrivee: 'Thiès',
    dateDepart: ''
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/carpool/trips?from=${search.villeDepart}&to=${search.villeArrivee}&date=${search.dateDepart}`);
      setTrips(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleBook = async (tripId: string, places: number) => {
    if(!window.confirm(`Confirmer la réservation de ${places} place(s) ? L'argent sera déduit de votre Wallet.`)) return;
    setBooking(true);
    try {
      const res = await api.post('/carpool/book', {
        tripId,
        passengerId: currentUser?.id,
        placesToBook: places
      });
      alert('Réservation confirmée ! Solde restant : ' + formatFcfa(res.data.newBalance));
      // Refresh search
      const res2 = await api.get(`/carpool/trips?from=${search.villeDepart}&to=${search.villeArrivee}&date=${search.dateDepart}`);
      setTrips(res2.data);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erreur lors de la réservation');
    }
    setBooking(false);
  };

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-[calc(100vh-60px)]">
      
      <div className="bg-blue-600 rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-black mb-1">Où allez-vous ?</h2>
        <p className="opacity-80 text-sm mb-6">Réservez votre place de covoiturage.</p>

        <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl flex flex-col gap-2 relative z-10">
          <div className="flex items-center bg-gray-50 rounded-xl p-2">
            <div className="w-8 flex justify-center"><MapPin className="w-5 h-5 text-gray-400"/></div>
            <select value={search.villeDepart} onChange={e=>setSearch({...search, villeDepart: e.target.value})} className="bg-transparent flex-1 p-2 outline-none text-black font-bold">
              {VILLES_INTERCITY.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-gray-50 rounded-xl p-2">
            <div className="w-8 flex justify-center"><MapPin className="w-5 h-5 text-blue-500"/></div>
            <select value={search.villeArrivee} onChange={e=>setSearch({...search, villeArrivee: e.target.value})} className="bg-transparent flex-1 p-2 outline-none text-black font-bold">
              {VILLES_INTERCITY.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-gray-50 rounded-xl p-2">
            <div className="w-8 flex justify-center"><Calendar className="w-5 h-5 text-gray-400"/></div>
            <input type="date" value={search.dateDepart} onChange={e=>setSearch({...search, dateDepart: e.target.value})} className="bg-transparent flex-1 p-2 outline-none text-black font-medium" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-1 hover:bg-blue-700 transition flex justify-center items-center gap-2">
            {loading ? 'Recherche...' : <><Search className="w-5 h-5"/> Rechercher</>}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {trips.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-10">
            Faites une recherche pour voir les trajets disponibles.
          </div>
        )}
        
        {trips.map(trip => {
          const available = trip.placesTotales - trip.placesReservees;
          return (
            <div key={trip.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm">{new Date(trip.dateDepart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    <div className="w-0.5 h-6 bg-gray-200 my-1"></div>
                    <span className="font-bold text-sm text-gray-400">---</span>
                  </div>
                  <div>
                    <p className="font-bold">{trip.villeDepart}</p>
                    <p className="text-sm text-gray-500 mt-6">{trip.villeArrivee}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl text-blue-600">{formatFcfa(trip.prixParPlace)}</div>
                  <div className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md inline-block mt-1">
                    {available} place(s) dispo
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: trip.driver.avatarColor || '#333' }}>
                    {trip.driver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{trip.driver.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">★ {trip.driver.rating.toFixed(1)} • {trip.driver.vehicle?.marque}</p>
                  </div>
                </div>
                
                {available > 0 ? (
                  <button onClick={() => handleBook(trip.id, 1)} disabled={booking} className="bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-blue-100">
                    Réserver <ArrowRight className="w-4 h-4"/>
                  </button>
                ) : (
                  <span className="text-gray-400 font-bold text-sm">Complet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
