import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import PassagerHome from './pages/passager/PassagerHome';
import ChauffeurHome from './pages/chauffeur/ChauffeurHome';
import PendingValidation from './pages/chauffeur/PendingValidation';
import AdminHome from './pages/AdminHome';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedRoute from './components/ProtectedRoute';
import LocationTracker from './components/LocationTracker';
import SocketManager from './components/SocketManager';

export default function App() {


  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { borderRadius: '10px', background: '#333', color: '#fff' } }} />
      <LocationTracker />
      <SocketManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/connexion" element={<Auth />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminHome />
            </ProtectedRoute>
          }
        />
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
