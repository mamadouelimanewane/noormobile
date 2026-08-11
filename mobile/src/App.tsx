import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import PassagerHome from './pages/passager/PassagerHome';
import ChauffeurHome from './pages/chauffeur/ChauffeurHome';
import PendingValidation from './pages/chauffeur/PendingValidation';
import ProtectedRoute from './components/ProtectedRoute';
import LocationTracker from './components/LocationTracker';

export default function App() {


  return (
    <BrowserRouter>
      <LocationTracker />
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
