import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  homePage?: boolean;
  requiredRole?: 'admin' | 'dashboard' | undefined; // undefined means any authenticated user
  children?: React.ReactNode;
}

interface AuthState {
  isAuthenticated: boolean;
  userRole?: string;
  isLoading: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ homePage, requiredRole, children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userRole: undefined,
    isLoading: true
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/me`, {
          credentials: 'include',
        });

        if (res.status === 200) {
          const userData = await res.json();
          setAuthState({
            isAuthenticated: true,
            userRole: userData.role,
            isLoading: false
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            userRole: undefined,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthState({
          isAuthenticated: false,
          userRole: undefined,
          isLoading: false
        });
      }
    };

    checkAuth();
  }, []);

  if (authState.isLoading) {
    return <div>Loading...</div>;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Temporary workaround: If user is authenticated but role is undefined, treat as admin
  if (requiredRole === 'admin' && authState.userRole === undefined) {
    console.log("Allowing access: Treating undefined role as admin (temporary workaround)");
    return <>{children}</>;
  }

  // If user is authenticated but doesn't have the required role
  if (requiredRole && authState.userRole !== requiredRole) {
    console.log(`Access denied: Required role '${requiredRole}', user role '${authState.userRole}'`);
    
    // For dashboard users trying to access admin routes, redirect to dashboard
    if (authState.userRole === 'dashboard') {
      return <Navigate to="/dashboard" />;
    }
    // If somehow a user has an invalid role, send them to login
    return <Navigate to="/login" />;
  }

  if (homePage && authState.isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
