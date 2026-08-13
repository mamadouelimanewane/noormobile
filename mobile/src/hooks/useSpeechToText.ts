import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const extractNumber = (text: string): number | null => {
    // 1. Chercher des chiffres directs (ex: "3000", "2 500", "2.500")
    const digitsOnly = text.replace(/[\s\.]/g, '');
    const match = digitsOnly.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }

    // 2. Fallback ultra basique pour quelques mots français (très simplifié)
    const lower = text.toLowerCase();
    let num = 0;
    if (lower.includes('mille')) {
      const parts = lower.split('mille');
      const multiplierStr = parts[0].trim();
      let multiplier = 1;
      if (multiplierStr.includes('deux')) multiplier = 2;
      else if (multiplierStr.includes('trois')) multiplier = 3;
      else if (multiplierStr.includes('quatre')) multiplier = 4;
      else if (multiplierStr.includes('cinq')) multiplier = 5;
      else if (multiplierStr.includes('six')) multiplier = 6;
      else if (multiplierStr.includes('sept')) multiplier = 7;
      else if (multiplierStr.includes('huit')) multiplier = 8;
      else if (multiplierStr.includes('neuf')) multiplier = 9;
      else if (multiplierStr.includes('dix')) multiplier = 10;
      
      num += multiplier * 1000;
      
      const rest = parts[1] || '';
      if (rest.includes('cinq cent')) num += 500;
      else if (rest.includes('cent')) num += 100;
    }
    
    return num > 0 ? num : null;
  };

  const startListening = useCallback((onResult: (amount: number | null, rawTranscript: string) => void, rawMode = false) => {
    if (!isSupported) {
      toast.error('La reconnaissance vocale n\'est pas supportée sur ce navigateur.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'fr-FR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🗣️ Voix captée :', transcript);
        
        if (rawMode) {
          onResult(null, transcript);
        } else {
          const amount = extractNumber(transcript);
          if (amount && amount >= 500) {
            toast.success(`Montant compris : ${amount} FCFA`);
            onResult(amount, transcript);
          } else {
            toast.error(`Je n'ai pas compris le montant ("${transcript}"). Répétez plus fort.`);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Accès au micro refusé.');
        } else {
          toast.error('Erreur de dictée vocale.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      toast.error('Erreur au lancement du micro.');
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}
