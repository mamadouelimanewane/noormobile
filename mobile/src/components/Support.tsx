import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { HelpCircle, MessageSquare, Send, ChevronLeft, Clock, CheckCircle } from 'lucide-react';

export default function Support() {
  const currentUser = useStore((s) => s.currentUser);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [message, setMessage] = useState('');

  // Reply form
  const [reply, setReply] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get(`/support/tickets/currentUser/${currentUser?.id}`);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTicket = async (id: string) => {
    try {
      const res = await api.get(`/support/tickets/${id}`);
      setActiveTicket(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/support/tickets', {
        userId: currentUser?.id, subject, category, initialMessage: message
      });
      setShowNew(false);
      setSubject(''); setMessage('');
      fetchTickets();
      loadTicket(res.data.id);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!reply.trim()) return;
    try {
      await api.post(`/support/tickets/${activeTicket.id}/messages`, {
        senderId: currentUser?.id, text: reply, isAdmin: false
      });
      setReply('');
      loadTicket(activeTicket.id);
    } catch (err) {
      console.error(err);
    }
  };

  if (activeTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-50 pb-safe">
        <div className="bg-white p-4 shadow-sm flex items-center gap-3">
          <button onClick={() => setActiveTicket(null)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-bold text-gray-800 leading-tight">{activeTicket.subject}</h2>
            <p className="text-xs text-gray-500">Ticket #{activeTicket.id.substring(activeTicket.id.length - 6)} • {activeTicket.status}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTicket.messages.map((m: any) => {
            const isMe = m.senderId === currentUser?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${isMe ? 'bg-noordrive-green text-white rounded-tr-none' : 'bg-white shadow-sm border border-gray-100 rounded-tl-none'}`}>
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {activeTicket.status !== 'CLOSED' && activeTicket.status !== 'RESOLVED' && (
          <form onSubmit={handleReply} className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" value={reply} onChange={e=>setReply(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none text-sm"
            />
            <button type="submit" disabled={!reply.trim()} className="w-12 h-12 bg-noordrive-green text-white rounded-full flex items-center justify-center disabled:opacity-50">
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-[calc(100vh-60px)]">
      <div className="bg-noordrive-black rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
         <HelpCircle className="w-12 h-12 text-noordrive-green mb-4" />
         <h2 className="text-xl font-bold mb-2">Centre d'Assistance</h2>
         <p className="text-gray-400 text-sm mb-6">Nous sommes là pour vous aider. Ouvrez un ticket si vous rencontrez un problème.</p>
         
         {!showNew && (
           <button onClick={() => setShowNew(true)} className="w-full bg-noordrive-green text-white font-bold py-3 rounded-xl hover:brightness-110 transition flex justify-center items-center gap-2">
             <MessageSquare className="w-5 h-5"/> Nouveau Ticket
           </button>
         )}
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-2">Décrivez votre problème</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Catégorie</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full border-2 rounded-xl p-3 font-medium bg-white focus:border-noordrive-green outline-none">
              <option value="GENERAL">Question générale</option>
              <option value="RIDE">Problème avec une course</option>
              <option value="PAYMENT">Problème de paiement / Wallet</option>
              <option value="ACCOUNT">Mon compte</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Sujet</label>
            <input required type="text" value={subject} onChange={e=>setSubject(e.target.value)} className="w-full border-2 rounded-xl p-3 font-medium focus:border-noordrive-green outline-none" placeholder="Ex: Objet perdu" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Message</label>
            <textarea required value={message} onChange={e=>setMessage(e.target.value)} rows={4} className="w-full border-2 rounded-xl p-3 text-sm focus:border-noordrive-green outline-none" placeholder="Détaillez votre problème..." />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-noordrive-black text-white font-bold py-4 rounded-xl mt-2">
            {loading ? 'Envoi...' : 'Envoyer le ticket'}
          </button>
          <button type="button" onClick={() => setShowNew(false)} className="w-full text-gray-500 font-bold py-2">Annuler</button>
        </form>
      )}

      <div>
        <h3 className="font-bold text-gray-800 mb-4 px-1">Vos tickets récents</h3>
        <div className="space-y-3">
          {tickets.length === 0 && <p className="text-gray-500 text-center py-8">Aucun ticket ouvert</p>}
          {tickets.map(ticket => (
            <button key={ticket.id} onClick={() => loadTicket(ticket.id)} className="w-full text-left bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? <CheckCircle className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800 line-clamp-1">{ticket.subject}</p>
                  <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()} • {ticket.status}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
