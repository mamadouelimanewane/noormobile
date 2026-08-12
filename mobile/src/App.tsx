import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import PassagerHome from './pages/passager/PassagerHome';
import ChauffeurHome from './pages/chauffeur/ChauffeurHome';
import PendingValidation from './pages/chauffeur/PendingValidation';
import { useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import LocationTracker from './components/LocationTracker';
import SocketManager from './components/SocketManager';
import { useStore } from './store/useStore';

export default function App() {
  const { currentUser } = useStore();

  useEffect(() => {
    // Simulate Firebase Cloud Messaging (Push Notifications) initialization
    // @ts-ignore
    if (currentUser && !currentUser.fcmToken) {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            const mockToken = `token_${Math.random().toString(36).substr(2, 9)}`;
            import('./lib/api').then(({ api }) => {
              api.post(`/users/${currentUser.id}/fcm-token`, { token: mockToken }).then(() => {
                // @ts-ignore
                useStore.getState().setCurrentUser({ ...currentUser, fcmToken: mockToken });
                console.log('Push notifications enabled:', mockToken);
              }).catch(console.error);
            });
          }
        });
      }
    }
  }, [currentUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { borderRadius: '10px', background: '#333', color: '#fff' } }} />
      <LocationTracker />
      <SocketManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/connexion" element={<Auth />} />
        <Route
          path="/passager"
          element={
            <ProtectedRoute role="passager">
              <PassagerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chauffeur"
          element={
            <ProtectedRoute role="chauffeur">
              <ChauffeurHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending"
          element={
            <ProtectedRoute role="chauffeur">
              <PendingValidation />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
