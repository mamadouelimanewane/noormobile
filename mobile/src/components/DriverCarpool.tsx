import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { VILLES_INTERCITY } from '../types';
import { MapPin, Calendar, Users, DollarSign, PlusCircle } from 'lucide-react';
import { formatFcfa } from '../lib/geo';

export default function DriverCarpool() {
  const user = useStore(s => s.user);
  const [trips, setTrips] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    villeDepart: 'Dakar',
    villeArrivee: 'Thiès',
    dateDepart: '',
    timeDepart: '',
    prixParPlace: 2000,
    placesTotales: 4
  });

  useEffect(() => {
    fetchMyTrips();
  }, []);

  const fetchMyTrips = async () => {
    try {
      // Pour l'instant on fetch tout et on filtre (Dans une vraie app, endpoint spécifique)
      const res = await api.get('/carpool/trips?from=&to=&date=');
      setTrips(res.data.filter((t: any) => t.driverId === user?.id));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dateTime = new Date(`${form.dateDepart}T${form.timeDepart}`);
      await api.post('/carpool/trips', {
        driverId: user?.id,
        villeDepart: form.villeDepart,
        villeArrivee: form.villeArrivee,
        dateDepart: dateTime.toISOString(),
        prixParPlace: Number(form.prixParPlace),
        placesTotales: Number(form.placesTotales)
      });
      alert('Trajet publié avec succès !');
      setShowForm(false);
      fetchMyTrips();
    } catch (e) {
      alert('Erreur lors de la publication');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-[calc(100vh-60px)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mes Trajets</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handlePublish} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg border-b pb-2">Publier un nouveau trajet</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Départ</label>
              <select value={form.villeDepart} onChange={e=>setForm({...form, villeDepart: e.target.value})} className="w-full border p-3 rounded-xl bg-white font-medium focus:border-blue-500 outline-none">
                {VILLES_INTERCITY.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Arrivée</label>
              <select value={form.villeArrivee} onChange={e=>setForm({...form, villeArrivee: e.target.value})} className="w-full border p-3 rounded-xl bg-white font-medium focus:border-blue-500 outline-none">
                {VILLES_INTERCITY.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Date</label>
              <input type="date" required value={form.dateDepart} onChange={e=>setForm({...form, dateDepart: e.target.value})} className="w-full border p-3 rounded-xl font-medium focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Heure</label>
              <input type="time" required value={form.timeDepart} onChange={e=>setForm({...form, timeDepart: e.target.value})} className="w-full border p-3 rounded-xl font-medium focus:border-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Prix par place (FCFA)</label>
              <input type="number" required value={form.prixParPlace} onChange={e=>setForm({...form, prixParPlace: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Places disponibles</label>
              <input type="number" required min="1" max="7" value={form.placesTotales} onChange={e=>setForm({...form, placesTotales: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-2 hover:bg-blue-700 transition">
            {loading ? 'Publication...' : 'Publier le Trajet'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {trips.length === 0 && !showForm && (
          <div className="text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-100">
            Aucun trajet publié. Cliquez sur + pour commencer.
          </div>
        )}
        {trips.map(trip => (
          <div key={trip.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trip.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {trip.status === 'OPEN' ? 'Ouvert' : 'Complet'}
                </span>
                <div className="font-bold text-lg mt-2">{trip.villeDepart} → {trip.villeArrivee}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-xl text-blue-600">{formatFcfa(trip.prixParPlace)}</div>
                <div className="text-xs text-gray-500 font-bold">par place</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-4 border-t pt-3">
              <div className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {new Date(trip.dateDepart).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
              <div className="flex items-center gap-1 font-bold text-gray-800"><Users className="w-4 h-4"/> {trip.placesReservees} / {trip.placesTotales} réservées</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
