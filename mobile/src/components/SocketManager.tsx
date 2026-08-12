import { useEffect } from 'react';
import { socket } from '../lib/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { playNotificationSound } from '../lib/sound';
import type { ServiceRequest, Offer } from '../types';

export default function SocketManager() {
  const currentUser = useStore(s => s.currentUser);

  useEffect(() => {
    if (!currentUser) {
      socket.disconnect();
      return;
    }

    socket.auth = { userId: currentUser.id };
    socket.connect();

    const handleConnect = () => {
      console.log('Socket connected');
      if (currentUser.role === 'chauffeur') {
        const drivers = useStore.getState().drivers;
        if (drivers[currentUser.id]?.isOnline) {
          socket.emit('driver:online', { driverId: currentUser.id });
        }
      }
    };
    const handleNewRequest = (req: ServiceRequest) => {
      if (currentUser.role === 'chauffeur') {
        const drivers = useStore.getState().drivers;
        if (drivers[currentUser.id]?.isOnline) {
          useStore.setState(s => {
            if (!s.requests.find(r => r.id === req.id)) {
              playNotificationSound();
              toast('Nouvelle demande à proximité !', { icon: '🚖' });
              return { requests: [req, ...s.requests] };
            }
            return s;
          });
        }
      }
    };

    const handleNewOffer = (offer: Offer) => {
      useStore.setState(s => {
        const reqIndex = s.requests.findIndex(r => r.id === offer.requestId);
        if (reqIndex !== -1 && s.requests[reqIndex].passengerId === currentUser.id) {
          const req = s.requests[reqIndex];
          if (!req.offers.find(o => o.id === offer.id)) {
            playNotificationSound();
            toast.success('Un chauffeur a fait une offre !');
            const newRequests = [...s.requests];
            newRequests[reqIndex] = { ...req, offers: [offer, ...req.offers] };
            return { requests: newRequests };
          }
        }
        return s;
      });
    };

    const handleRideAccepted = ({ request }: { request: ServiceRequest }) => {
      useStore.setState(s => {
        const reqIndex = s.requests.findIndex(r => r.id === request.id);
        if (reqIndex !== -1) {
          if (request.driverId === currentUser.id) {
            playNotificationSound();
            toast.success('Course acceptée par le client !');
          }
          const newRequests = [...s.requests];
          newRequests[reqIndex] = request;
          return { requests: newRequests };
        } else if (request.driverId === currentUser.id || request.passengerId === currentUser.id) {
           return { requests: [request, ...s.requests] };
        }
        return s;
      });
    };

    const handleRideUpdated = (request: ServiceRequest) => {
      useStore.setState(s => {
        const reqIndex = s.requests.findIndex(r => r.id === request.id);
        if (reqIndex !== -1) {
          if (request.status === 'termine') {
             playNotificationSound();
             toast('Course terminée !', { icon: '🏁' });
          }
          const newRequests = [...s.requests];
          newRequests[reqIndex] = request;
          return { requests: newRequests };
        }
        return s;
      });
    };

    const handleRideCancelled = (request: ServiceRequest) => {
      useStore.setState(s => {
        const reqIndex = s.requests.findIndex(r => r.id === request.id);
        if (reqIndex !== -1) {
          if (currentUser.role === 'chauffeur' || currentUser.role === 'passager') {
             playNotificationSound();
             toast.error('La course a été annulée.', { icon: '❌' });
          }
          const newRequests = [...s.requests];
          newRequests[reqIndex] = request;
          return { requests: newRequests };
        }
        return s;
      });
    };

    const handleRideCreated = (req: ServiceRequest) => {
      useStore.setState(s => {
        if (!s.requests.find(r => r.id === req.id)) {
          return { requests: [req, ...s.requests] };
        }
        return s;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('ride:new_request', handleNewRequest);
    socket.on('ride:new_offer', handleNewOffer);
    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:updated', handleRideUpdated);
    socket.on('ride:cancelled', handleRideCancelled);
    socket.on('ride:created', handleRideCreated);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('ride:new_request', handleNewRequest);
      socket.off('ride:new_offer', handleNewOffer);
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:updated', handleRideUpdated);
      socket.off('ride:cancelled', handleRideCancelled);
      socket.off('ride:created', handleRideCreated);
    };
  }, [currentUser]);

  return null;
}
