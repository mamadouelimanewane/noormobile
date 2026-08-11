import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import DriverValidation from './pages/DriverValidation';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  if (!isAdmin) {
    return <Login onLogin={() => setIsAdmin(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8faf9] flex">
        <Sidebar onLogout={() => setIsAdmin(false)} />
        <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<LiveMap />} />
              <Route path="/validation" element={<DriverValidation />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
