import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';

export default function ChatBox({ requestId }: { requestId: string }) {
  const allMessages = useStore((s) => s.messages);
  const messages = useMemo(() => allMessages.filter((m) => m.requestId === requestId), [allMessages, requestId]);
  const sendMessage = useStore((s) => s.sendMessage);
  const currentUser = useStore((s) => s.currentUser);
  const [text, setText] = useState('');

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(requestId, text.trim());
    setText('');
  }

  return (
    <div className="border rounded-xl overflow-hidden flex flex-col h-64">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.length === 0 && <p className="text-xs text-gray-400 text-center mt-4">Aucun message pour l'instant.</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
              m.senderId === currentUser?.id ? 'bg-noordrive-green text-white ml-auto' : 'bg-white border'
            }`}
          >
            <div className="text-[10px] opacity-70 mb-0.5">{m.senderName}</div>
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex border-t">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="px-4 text-noordrive-green font-semibold text-sm">
          Envoyer
        </button>
      </form>
    </div>
  );
}
