import { useEffect } from 'react';
import { socket } from '../lib/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
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

    const handleConnect = () => console.log('Socket connected');
    
    const handleNewRequest = (req: ServiceRequest) => {
      if (currentUser.role === 'chauffeur') {
        const drivers = useStore.getState().drivers;
        if (drivers[currentUser.id]?.isOnline) {
          useStore.setState(s => {
            if (!s.requests.find(r => r.id === req.id)) {
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
             toast('Course terminée !', { icon: '🏁' });
          }
          const newRequests = [...s.requests];
          newRequests[reqIndex] = request;
          return { requests: newRequests };
        }
        return s;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('ride:new_request', handleNewRequest);
    socket.on('ride:new_offer', handleNewOffer);
    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:updated', handleRideUpdated);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('ride:new_request', handleNewRequest);
      socket.off('ride:new_offer', handleNewOffer);
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:updated', handleRideUpdated);
    };
  }, [currentUser]);

  return null;
}
