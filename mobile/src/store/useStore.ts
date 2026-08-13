import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { socket, api } from '../lib/api';
import type {
  Driver,
  Passenger,
  User,
  ServiceRequest,
  ServiceType,
  GeoPoint,
  ChatMessage,
  LoanRequest,
  LoanStatus,
  PackageInfo,
  IntercityInfo,
  Role,
  Transaction,
  PlatformSettings,
  PaymentMethod,
} from '../types';

const AVATAR_COLORS = ['#0a8f4c', '#f5b301', '#2563eb', '#e33', '#7c3aed', '#0891b2'];

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

interface StoreState {
  currentUser: (User & { walletBalance?: number }) | null;
  passengers: Record<string, Passenger>;
  drivers: Record<string, Driver>;
  requests: ServiceRequest[];
  messages: ChatMessage[];
  loans: LoanRequest[];
  transactions: Transaction[];
  settings: PlatformSettings;

  setCurrentUser: (user: User | null) => void;
  register: (name: string, phone: string, role: Role, vehicle?: Driver['vehicle']) => { ok: boolean; error?: string };
  login: (phone: string, role: Role) => { ok: boolean; error?: string };
  logout: () => void;

  createRequest: (params: {
    type: ServiceType;
    pickup: GeoPoint;
    dropoff: GeoPoint;
    proposedPrice: number;
    packageInfo?: PackageInfo;
    intercityInfo?: IntercityInfo;
  }) => string;
  driverMakeOffer: (requestId: string, driverId: string, price: number, etaMin: number) => void;
  acceptOffer: (requestId: string, offerId: string) => void;
  declineOffer: (requestId: string, offerId: string) => void;
  cancelRequest: (requestId: string) => void;
  updateRideStatus: (requestId: string, status: 'en_cours' | 'termine') => void;
  sendMessage: (requestId: string, text: string) => void;
  rateRequest: (requestId: string, stars: number, target: 'driver' | 'passenger') => void;
  driverSetOnline: (driverId: string, isOnline: boolean) => void;

  requestLoan: (driverId: string, montant: number, motif: string, dureeMois: number) => void;
  setLoanStatus: (loanId: string, status: LoanStatus) => void;

  topupWallet: (userId: string, role: Role, amount: number, method: PaymentMethod) => Promise<boolean>;
  cashoutWallet: (driverId: string, amount: number, method: PaymentMethod) => Promise<boolean>;
  updateSettings: (settings: Partial<PlatformSettings>) => void;
  setupSocket: () => void;
  fetchActiveDrivers: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      setCurrentUser: (user) => {
        set((s) => {
          const updates: any = { currentUser: user };
          if (user) {
            if (user.role === 'chauffeur') {
              updates.drivers = { ...s.drivers, [user.id]: { ...s.drivers[user.id], ...user } };
            }
            if (user.role === 'passager') {
              updates.passengers = { ...s.passengers, [user.id]: { ...s.passengers[user.id], ...user } };
            }
          }
          return updates;
        });
        if (user) {
          socket.auth = { userId: user.id };
          socket.connect();
          get().setupSocket();
        } else {
          socket.disconnect();
        }
      },
      passengers: {},
      drivers: {},
      requests: [],
      messages: [],
      loans: [],
      transactions: [],
      settings: { commissionRate: 0.12, taxRate: 0.18 },
      
      setupSocket: () => {
        socket.off('connect').on('connect', () => {
          const state = get();
          const user = state.currentUser;
          if (user?.role === 'chauffeur') {
            const driver = state.drivers[user.id];
            if (driver?.isOnline) {
              socket.emit('driver:online', { driverId: user.id });
            }
          } else {
            get().fetchActiveDrivers();
          }
        });
        
        socket.off('ride:created').on('ride:created', (req) => {
          set((s) => ({ requests: [req, ...s.requests] }));
        });
        socket.off('ride:new_request').on('ride:new_request', (req) => {
          set((s) => ({ requests: [req, ...s.requests] }));
        });
        socket.off('ride:new_offer').on('ride:new_offer', (offer) => {
          set((s) => ({
            requests: s.requests.map((r) =>
              r.id === offer.requestId
                ? { ...r, offers: [...r.offers, offer], status: 'negociation', updatedAt: Date.now() }
                : r
            ),
          }));
        });
        socket.off('ride:accepted').on('ride:accepted', ({ request, offer }) => {
          set((s) => ({
            requests: s.requests.map((r) =>
              r.id === request.id
                ? {
                    ...r,
                    status: 'attribue',
                    acceptedOfferId: offer.id,
                    driverId: offer.driverId,
                    proposedPrice: offer.price,
                    driverPosition: offer.driver?.position,
                    updatedAt: Date.now(),
                    offers: r.offers.map((o) =>
                      o.id === offer.id ? { ...o, status: 'acceptee' } : { ...o, status: 'refusee' },
                    ),
                  }
                : r
            ),
          }));
        });
        socket.off('ride:cancelled').on('ride:cancelled', (req) => {
          set((s) => ({
            requests: s.requests.map((r) => (r.id === req.id ? { ...r, status: 'annule', updatedAt: Date.now() } : r)),
          }));
        });
        socket.off('driver_moved').on('driver_moved', (data: { driverId: string; lat: number; lng: number }) => {
          set((s) => {
            const driver = s.drivers[data.driverId];
            if (!driver) return s;
            return {
              drivers: {
                ...s.drivers,
                [data.driverId]: {
                  ...driver,
                  position: { lat: data.lat, lng: data.lng }
                }
              },
              requests: s.requests.map((r) =>
                r.driverId === data.driverId
                  ? { ...r, driverPosition: { lat: data.lat, lng: data.lng } }
                  : r
              )
            };
          });
        });
        socket.off('ride:updated').on('ride:updated', (req) => {
          set((s) => ({
            requests: s.requests.map((r) => (r.id === req.id ? { ...r, status: req.status, updatedAt: req.updatedAt } : r)),
          }));
        });
        socket.off('driver:moved').on('driver:moved', (data: any) => {
          set((s) => {
             if (!data.position) return s;
             const driver = s.drivers[data.driverId] || { 
               id: data.driverId, 
               isOnline: true, 
               role: 'chauffeur', 
               name: 'Chauffeur', 
               rating: 5, 
               ratingCount: 0 
             };
             return { drivers: { ...s.drivers, [data.driverId]: { ...driver, position: { lat: data.position.lat, lng: data.position.lng, heading: data.position.heading, label: 'En mouvement' } } } };
          });
        });
      },

      register: (name, phone, role, vehicle) => {
        const state = get();
        const existing =
          role === 'chauffeur'
            ? Object.values(state.drivers).find((d) => d.phone === phone)
            : Object.values(state.passengers).find((p) => p.phone === phone);
        if (existing) return { ok: false, error: 'Ce numéro est déjà utilisé.' };

        if (role === 'chauffeur') {
          if (!vehicle) return { ok: false, error: 'Informations véhicule requises.' };
          const driver: Driver = {
            id: uid('driver'),
            name,
            phone,
            role: 'chauffeur',
            rating: 5,
            ratingCount: 0,
            createdAt: Date.now(),
            avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
            vehicle,
            isOnline: true,
            walletBalance: 0,
            position: { lat: 14.6937, lng: -17.4441, label: 'Médina' },
          };
          set((s) => ({ drivers: { ...s.drivers, [driver.id]: driver }, currentUser: driver }));
          return { ok: true };
        }
        const passenger: Passenger = {
          id: uid('passager'),
          name,
          phone,
          role: 'passager',
          rating: 5,
          ratingCount: 0,
          createdAt: Date.now(),
          avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          walletBalance: 5000,
        };
        set((s) => ({ passengers: { ...s.passengers, [passenger.id]: passenger }, currentUser: passenger }));
        return { ok: true };
      },

      login: (phone, role) => {
        const state = get();
        if (role === 'admin') {
          if (phone !== 'admin') return { ok: false, error: 'Identifiant admin invalide.' };
          set({
            currentUser: {
              id: 'admin-1',
              name: 'Administrateur NOORDRIVE',
              phone: 'admin',
              role: 'admin',
              rating: 5,
              ratingCount: 0,
              createdAt: Date.now(),
              avatarColor: '#0e0e10',
            },
          });
          return { ok: true };
        }
        const user =
          role === 'chauffeur'
            ? Object.values(state.drivers).find((d) => d.phone === phone && !d.isBot)
            : Object.values(state.passengers).find((p) => p.phone === phone);
        if (!user) return { ok: false, error: 'Aucun compte trouvé avec ce numéro.' };
        set({ currentUser: user });
        return { ok: true };
      },

      logout: () => {
        set({ currentUser: null });
        socket.disconnect();
      },

      createRequest: ({ type, pickup, dropoff, proposedPrice, packageInfo, intercityInfo }) => {
        const state = get();
        const passenger = state.currentUser as Passenger;
        socket.emit('ride:request', { type, pickup, dropoff, proposedPrice, packageInfo, intercityInfo, passengerId: passenger.id });
        return 'pending-id';
      },

      driverMakeOffer: (requestId, driverId, price, etaMin) => {
        socket.emit('ride:offer', { requestId, driverId, price, etaMin });
      },

      acceptOffer: (requestId, offerId) => {
        socket.emit('ride:accept', { requestId, offerId });
      },

      declineOffer: (requestId, offerId) => {
        set(s => {
          const reqIndex = s.requests.findIndex(r => r.id === requestId);
          if (reqIndex !== -1) {
            const req = s.requests[reqIndex];
            const newRequests = [...s.requests];
            newRequests[reqIndex] = {
              ...req,
              offers: req.offers.filter(o => o.id !== offerId) // On le retire simplement de la liste locale
            };
            return { requests: newRequests };
          }
          return s;
        });
      },

      cancelRequest: (requestId) => {
        socket.emit('ride:cancel', { requestId });
      },

      updateRideStatus: (requestId, status) => {
        socket.emit('ride:status', { requestId, status });
      },

      sendMessage: (requestId, text) => {
        const user = get().currentUser;
        if (!user) return;
        const msg: ChatMessage = {
          id: uid('msg'),
          requestId,
          senderId: user.id,
          senderName: user.name,
          text,
          createdAt: Date.now(),
        };
        set((s) => ({ messages: [...s.messages, msg] }));
      },

      rateRequest: (requestId, stars, target) => {
        set((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          if (!req) return s;
          const requests = s.requests.map((r) =>
            r.id === requestId
              ? { ...r, [target === 'driver' ? 'ratingDriver' : 'ratingPassenger']: stars }
              : r,
          );
          if (stars <= 0) return { requests };
          if (target === 'driver' && req.driverId) {
            const driver = s.drivers[req.driverId];
            if (driver) {
              const newCount = driver.ratingCount + 1;
              const newRating = (driver.rating * driver.ratingCount + stars) / newCount;
              return {
                requests,
                drivers: {
                  ...s.drivers,
                  [req.driverId]: { ...driver, rating: Math.round(newRating * 10) / 10, ratingCount: newCount },
                },
              };
            }
          }
          if (target === 'passenger') {
            const passenger = s.passengers[req.passengerId];
            if (passenger) {
              const newCount = passenger.ratingCount + 1;
              const newRating = (passenger.rating * passenger.ratingCount + stars) / newCount;
              return {
                requests,
                passengers: {
                  ...s.passengers,
                  [req.passengerId]: { ...passenger, rating: Math.round(newRating * 10) / 10, ratingCount: newCount },
                },
              };
            }
          }
          return { requests };
        });
      },

      driverSetOnline: (driverId, isOnline) => {
        if (isOnline) {
          socket.emit('driver:online', { driverId });
        } else {
          socket.emit('driver:offline', { driverId });
        }
        set((s) => ({ drivers: { ...s.drivers, [driverId]: { ...s.drivers[driverId], isOnline } } }));
      },

      requestLoan: (driverId, montant, motif, dureeMois) => {
        const driver = get().drivers[driverId];
        if (!driver) return;
        const tauxMensuel = 0.02;
        const mensualite = Math.round((montant * (1 + tauxMensuel * dureeMois)) / dureeMois);
        const loan: LoanRequest = {
          id: uid('loan'),
          driverId,
          driverName: driver.name,
          montant,
          motif,
          dureeMois,
          mensualite,
          status: 'en_attente',
          createdAt: Date.now(),
        };
        set((s) => ({ loans: [loan, ...s.loans] }));
      },

      setLoanStatus: (loanId, status) => {
        set((s) => {
          const loan = s.loans.find((l) => l.id === loanId);
          const drivers = { ...s.drivers };
          const newTransactions = [...s.transactions];
          
          if (loan && status === 'approuve' && loan.status !== 'approuve') {
            const driver = drivers[loan.driverId];
            if (driver) {
              drivers[loan.driverId] = { ...driver, walletBalance: driver.walletBalance + loan.montant };
              newTransactions.unshift({
                id: uid('tx'), userId: loan.driverId, userRole: 'chauffeur', type: 'loan',
                amount: loan.montant, method: 'cash', status: 'completed', reference: loan.id,
                createdAt: Date.now(), description: `Crédit NOORDRIVE.Money accordé`
              });
            }
          }
          return {
            loans: s.loans.map((l) => (l.id === loanId ? { ...l, status } : l)),
            drivers,
            transactions: newTransactions,
          };
        });
      },

      updateSettings: (settings) => set((s) => ({ settings: { ...s.settings, ...settings } })),

      topupWallet: async (userId, role, amount, method) => {
        try {
          const res = await api.post('/wallet/topup', { userId, role, amount, method });
          if (res.data.ok) {
            const currentRole = get().currentUser?.role;
            set({ currentUser: { ...res.data.user, role: currentRole || res.data.user.role } });
            return true;
          }
          return false;
        } catch (err) {
          console.error(err);
          return false;
        }
      },

      cashoutWallet: async (driverId, amount, method) => {
        try {
          const res = await api.post('/wallet/cashout', { userId: driverId, amount, method });
          if (res.data.ok) {
            const currentRole = get().currentUser?.role;
            set({ currentUser: { ...res.data.user, role: currentRole || res.data.user.role } });
            return true;
          }
          return false;
        } catch (err) {
          console.error(err);
          return false;
        }
      },

      fetchActiveDrivers: async () => {
        try {
          const res = await api.get('/drivers/active');
          const activeDrivers = res.data;
          set((s) => {
            const newDrivers = { ...s.drivers };
            activeDrivers.forEach((d: any) => {
              newDrivers[d.id] = { ...newDrivers[d.id], ...d };
            });
            return { drivers: newDrivers };
          });
        } catch (err) {
          console.error('Failed to fetch active drivers:', err);
        }
      },
    }),
    {
      name: 'noordrive-storage',
      partialize: (s) => ({
        currentUser: s.currentUser,
        passengers: s.passengers,
        drivers: s.drivers,
        requests: s.requests,
        messages: s.messages,
        loans: s.loans,
        transactions: s.transactions,
        settings: s.settings,
      }),
    },
  ),
);

