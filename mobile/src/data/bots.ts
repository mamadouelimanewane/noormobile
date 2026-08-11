import type { Driver } from '../types';
import { NEIGHBORHOODS } from '../types';

const PRENOMS = [
  'Moussa', 'Awa', 'Ibrahima', 'Fatou', 'Cheikh', 'Aïssatou', 'Ousmane', 'Khady',
  'Mamadou', 'Bineta', 'Abdou', 'Aminata', 'Lamine', 'Sokhna', 'Modou', 'Ndeye',
];
const NOMS = [
  'Diop', 'Ndiaye', 'Fall', 'Sarr', 'Gueye', 'Diallo', 'Ba', 'Sy',
  'Faye', 'Cissé', 'Sow', 'Mbaye', 'Thiam', 'Kane', 'Diagne', 'Seck',
];
const MARQUES: [string, string][] = [
  ['Toyota', 'Corolla'], ['Hyundai', 'Accent'], ['Kia', 'Rio'], ['Suzuki', 'Alto'],
  ['Renault', 'Logan'], ['Dacia', 'Sandero'], ['Toyota', 'Yaris'], ['Peugeot', '301'],
];
const COULEURS = ['Blanche', 'Grise', 'Noire', 'Bleue', 'Rouge'];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPlaque(): string {
  const n = () => Math.floor(Math.random() * 9000 + 1000);
  const lettres = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `DK ${n()} ${lettres}`;
}

const AVATAR_COLORS = ['#0a8f4c', '#f5b301', '#2563eb', '#e33', '#7c3aed', '#0891b2'];

export function generateBotDrivers(count: number): Driver[] {
  const drivers: Driver[] = [];
  for (let i = 0; i < count; i++) {
    const [marque, modele] = randomOf(MARQUES);
    const pos = randomOf(NEIGHBORHOODS);
    drivers.push({
      id: `bot-driver-${i}`,
      name: `${randomOf(PRENOMS)} ${randomOf(NOMS)}`,
      phone: `77${Math.floor(1000000 + Math.random() * 8999999)}`,
      role: 'chauffeur',
      rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
      ratingCount: Math.floor(20 + Math.random() * 400),
      createdAt: Date.now() - Math.floor(Math.random() * 1e10),
      avatarColor: randomOf(AVATAR_COLORS),
      vehicle: { marque, modele, plaque: randomPlaque(), couleur: randomOf(COULEURS) },
      isOnline: true,
      walletBalance: Math.floor(Math.random() * 50000),
      position: { ...pos, lat: pos.lat + (Math.random() - 0.5) * 0.01, lng: pos.lng + (Math.random() - 0.5) * 0.01 },
      isBot: true,
    });
  }
  return drivers;
}
