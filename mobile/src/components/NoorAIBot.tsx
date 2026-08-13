import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Bot, Sparkles, X } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface NoorAIBotProps {
  onIntentParsed: (data: any) => void;
}

export default function NoorAIBot({ onIntentParsed }: NoorAIBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isListening, isSupported, startListening, stopListening } = useSpeechToText();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setIsProcessing(true);
    try {
      const res = await api.post('/ai/parse-intent', { text });
      if (res.data.intentParsed) {
        toast.success("Demande comprise par l'IA !");
        onIntentParsed(res.data.data);
        setIsOpen(false);
        setText('');
      } else {
        toast.error("Je n'ai pas bien compris votre demande.");
      }
    } catch (err) {
      toast.error('Erreur lors de la communication avec Noor AI');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((_, transcript) => {
        setText(transcript);
        // On pourrait auto-submit ici, mais laissons l'utilisateur valider
      }, true);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-[60] bg-black text-white p-4 rounded-full shadow-2xl shadow-black/30 border-2 border-white flex items-center justify-center group"
      >
        <Bot className="w-6 h-6 group-hover:animate-pulse text-white" />
        <div className="absolute -top-1 -right-1 bg-noordrive-green w-3 h-3 rounded-full border-2 border-white animate-ping"></div>
        <div className="absolute -top-1 -right-1 bg-noordrive-green w-3 h-3 rounded-full border-2 border-white"></div>
      </motion.button>

      {/* AI Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 z-[70] bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-black to-gray-800 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Noor AI</h3>
                  <p className="text-xs text-gray-300">Votre assistant intelligent</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-sm text-gray-700 font-medium">
                👋 Bonjour ! Dites-moi ce que vous souhaitez faire.
                <br />
                <span className="text-gray-400 text-xs mt-2 block italic">Ex: "Trouve moi une voiture confort pour aller à l'Aéroport AIBD"</span>
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Votre demande..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-black transition font-medium"
                    disabled={isProcessing}
                  />
                  {isSupported && (
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-gray-100 hover:text-black'}`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!text.trim() || isProcessing}
                  className="bg-black text-white p-3.5 rounded-2xl disabled:bg-gray-200 disabled:text-gray-400 hover:scale-105 transition active:scale-95"
                >
                  {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
