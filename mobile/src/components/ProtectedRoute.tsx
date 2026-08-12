import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Role } from '../types';

export default function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const currentUser = useStore((s) => s.currentUser);
  const location = useLocation();

  if (!currentUser || currentUser.role !== role) {
    return <Navigate to="/connexion" replace />;
  }

  if (role === 'chauffeur' && currentUser.accountStatus === 'PENDING' && location.pathname !== '/pending') {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
