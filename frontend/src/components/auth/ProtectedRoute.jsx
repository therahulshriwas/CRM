// frontend/src/components/auth/ProtectedRoute.jsx
// Route guard that redirects unauthenticated users to /login and renders an Outlet for children routes.
// Used in: App.jsx route tree for every protected page.

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingScreen from '../common/LoadingScreen';

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthStore();

  // While the auth profile is being re-validated on app mount, show a branded splash.
  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
