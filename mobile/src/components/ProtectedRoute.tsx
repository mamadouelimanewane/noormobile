import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Role } from '../types';

export default function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const currentUser = useStore((s) => s.currentUser);
  if (!currentUser || currentUser.role !== role) {
    return <Navigate to="/connexion" replace />;
  }

  if (role === 'chauffeur' && currentUser.accountStatus === 'PENDING') {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
