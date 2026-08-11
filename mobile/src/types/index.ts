export type Role = 'passager' | 'chauffeur' | 'admin';

export type ServiceType = 'ride' | 'delivery' | 'intercity';

export type RequestStatus =
  | 'recherche'   // en attente d'offres
  | 'negociation' // au moins une offre reçue
  | 'attribue'    // offre acceptée, chauffeur en route vers le passager
  | 'en_cours'    // trajet en cours (pickup -> dropoff)
  | 'termine'
  | 'annule';

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  accountStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  rating: number;
  ratingCount: number;
  createdAt: number;
  avatarColor: string;
}

export interface Driver extends User {
  role: 'chauffeur';
  vehicle: {
    marque: string;
    modele: string;
    plaque: string;
    couleur: string;
  };
  isOnline: boolean;
  walletBalance: number;
  position: GeoPoint;
  isBot?: boolean;
}

export interface Passenger extends User {
  role: 'passager';
  walletBalance: number;
}

export interface Offer {
  id: string;
  requestId: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  vehicle: string;
  price: number;
  etaMin: number;
  status: 'en_attente' | 'acceptee' | 'refusee' | 'retiree';
  createdAt: number;
  isBot: boolean;
}

export interface PackageInfo {
  description: string;
  taille: 'petit' | 'moyen' | 'grand';
  destinataireNom: string;
  destinatairePhone: string;
}

export interface IntercityInfo {
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // ISO date
  places: number;
}

export interface ServiceRequest {
  id: string;
  type: ServiceType;
  passengerId: string;
  passengerName: string;
  pickup: GeoPoint;
  dropoff: GeoPoint;
  proposedPrice: number;
  status: RequestStatus;
  offers: Offer[];
  acceptedOfferId?: string;
  driverId?: string;
  createdAt: number;
  updatedAt: number;
  packageInfo?: PackageInfo;
  intercityInfo?: IntercityInfo;
  driverPosition?: GeoPoint;
  ratingPassenger?: number;
  ratingDriver?: number;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export type LoanStatus = 'en_attente' | 'approuve' | 'refuse' | 'rembourse' | 'en_cours';

export interface LoanRequest {
  id: string;
  driverId: string;
  driverName: string;
  montant: number;
  motif: string;
  dureeMois: number;
  mensualite: number;
  status: LoanStatus;
  createdAt: number;
}

export const NEIGHBORHOODS: GeoPoint[] = [
  { lat: 14.6708, lng: -17.4381, label: 'Plateau' },
  { lat: 14.6937, lng: -17.4441, label: 'Médina' },
  { lat: 14.7167, lng: -17.4677, label: 'Point E' },
  { lat: 14.7194, lng: -17.4838, label: 'Mermoz' },
  { lat: 14.7247, lng: -17.4919, label: 'Ouakam' },
  { lat: 14.7440, lng: -17.5133, label: 'Ngor' },
  { lat: 14.7469, lng: -17.4838, label: 'Yoff' },
  { lat: 14.7500, lng: -17.4600, label: 'Parcelles Assainies' },
  { lat: 14.7186, lng: -17.4550, label: 'Grand Yoff' },
  { lat: 14.7275, lng: -17.4644, label: 'Sicap Liberté' },
  { lat: 14.7378, lng: -17.5019, label: 'Almadies' },
  { lat: 14.6889, lng: -17.4614, label: 'Fann' },
  { lat: 14.7089, lng: -17.4489, label: 'HLM' },
  { lat: 14.7550, lng: -17.3900, label: 'Pikine' },
  { lat: 14.7700, lng: -17.4000, label: 'Guédiawaye' },
  { lat: 14.7167, lng: -17.2733, label: 'Rufisque' },
  { lat: 14.7411, lng: -17.4961, label: 'Ouest Foire' },
  { lat: 14.7028, lng: -17.4494, label: 'Sacré-Cœur' },
  { lat: 14.7742, lng: -17.3617, label: 'Yeumbeul' },
  { lat: 14.7075, lng: -17.4522, label: 'Grand Dakar' },
];

export const VILLES_INTERCITY = [
  'Dakar',
  'Thiès',
  'Mbour',
  'Saint-Louis',
  'Touba',
  'Kaolack',
  'Ziguinchor',
  'Tambacounda',
];

export type TransactionType = 'topup' | 'cashout' | 'payment' | 'commission' | 'loan';
export type PaymentMethod = 'wave' | 'orange_money' | 'cash';

export interface Transaction {
  id: string;
  userId: string;
  userRole: Role;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  createdAt: number;
  description: string;
  requestId?: string;
}

export interface PlatformSettings {
  commissionRate: number; // e.g. 0.12 for 12%
  taxRate: number; // e.g. 0.18 for 18% TVA
}
