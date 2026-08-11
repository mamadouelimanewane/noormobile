export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    // Si l'utilisateur n'a pas encore interagi avec la page, le navigateur peut bloquer l'audio
    // Mais dans notre cas, l'utilisateur a généralement déjà cliqué (pour se connecter ou demander une course)
    const ctx = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05); // Attaque rapide
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Relâchement doux
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Une sonnerie agréable type "Uber" : deux notes claires (Mi 5 puis La 5)
    playTone(659.25, now, 0.3); 
    playTone(880.00, now + 0.15, 0.4);
    
  } catch (e) {
    console.error('Erreur lors de la lecture du son de notification', e);
  }
}
