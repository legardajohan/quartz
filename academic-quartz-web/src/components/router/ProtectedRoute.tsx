import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/useAuthStore';

export const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    // Si no hay token, redirige al usuario a la página de login
    return <Navigate to="/login" replace />;
  }

  // Si hay un token, renderiza el componente de la ruta anidada (hijo)
  return <Outlet />;
};
