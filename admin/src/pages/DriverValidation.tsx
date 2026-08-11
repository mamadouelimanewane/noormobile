import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, CheckCircle, XCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:3001/api';

export default function DriverValidation() {
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  async function fetchPendingDrivers() {
    try {
      const res = await axios.get(`${API_URL}/admin/pending-drivers`);
      setPendingDrivers(res.data.users);
    } catch (err) {
      console.error(err);
    }
  }

  async function approveDriver(driverId: string) {
    try {
      await axios.post(`${API_URL}/admin/approve-driver`, { driverId });
      setPendingDrivers(prev => prev.filter(d => d.id !== driverId));
      setSelectedDriver(null);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-noordrive-green" /> Validation des Chauffeurs
        </h2>
        <p className="text-gray-500 mt-1">Examinez les documents et approuvez les inscriptions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <h3 className="font-bold mb-4 text-gray-700">En attente ({pendingDrivers.length})</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {pendingDrivers.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`w-full text-left p-4 rounded-xl border transition ${
                    selectedDriver?.id === driver.id ? 'border-noordrive-green bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold">{driver.name}</div>
                  <div className="text-xs text-gray-500">{driver.phone}</div>
                </button>
              ))}
              {pendingDrivers.length === 0 && (
                <div className="text-center py-10 text-gray-400">Aucun chauffeur en attente.</div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedDriver ? (
              <motion.div
                key={selectedDriver.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedDriver.name}</h3>
                    <p className="text-gray-500">{selectedDriver.email} · {selectedDriver.phone}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{selectedDriver.vehicle?.marque} {selectedDriver.vehicle?.modele}</div>
                    <div className="text-sm bg-black text-white px-2 py-1 rounded inline-block mt-1">{selectedDriver.vehicle?.plaque}</div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <h4 className="font-bold text-lg border-b pb-2">Documents fournis</h4>
                  
                  {/* Mock documents pour la démo */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="border rounded-xl p-4 text-center space-y-3 hover:border-gray-300 transition cursor-pointer">
                      <FileText className="w-10 h-10 text-gray-400 mx-auto" />
                      <div className="font-medium text-sm">Pièce d'identité</div>
                      <div className="text-xs text-noordrive-green bg-green-50 px-2 py-1 rounded-full inline-block">Validé par IA</div>
                    </div>
                    <div className="border rounded-xl p-4 text-center space-y-3 hover:border-gray-300 transition cursor-pointer">
                      <FileText className="w-10 h-10 text-gray-400 mx-auto" />
                      <div className="font-medium text-sm">Permis de conduire</div>
                      <div className="text-xs text-noordrive-green bg-green-50 px-2 py-1 rounded-full inline-block">Validé par IA</div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-3">
                    <button 
                      onClick={() => approveDriver(selectedDriver.id)}
                      className="flex-1 bg-noordrive-green text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-noordrive-green/20 hover:opacity-90 transition"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approuver le compte
                    </button>
                    <button 
                      onClick={() => setSelectedDriver(null)}
                      className="bg-red-50 text-red-600 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition"
                    >
                      <XCircle className="w-5 h-5" />
                      Rejeter
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                <UserCheck className="w-16 h-16 mb-4 text-gray-300" />
                <p>Sélectionnez un chauffeur pour examiner son dossier</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
