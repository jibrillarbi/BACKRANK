import { Navigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../api';
import { clearCurrentUser, storeCurrentUser } from '../api/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    api.getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        storeCurrentUser(user);
        setHasSession(true);
      })
      .catch(() => {
        if (!isMounted) return;
        clearCurrentUser();
        setHasSession(false);
      })
      .finally(() => {
        if (isMounted) {
          setIsChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black text-base-content flex items-center justify-center">
        <p className="text-base-content/70">Checking session...</p>
      </div>
    );
  }

  if (!hasSession) {
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
}
