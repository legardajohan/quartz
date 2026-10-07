import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { WelcomeLoader } from '../../features/auth/components/WelcomeLoader';

export default function AppRoot() {
  const showWelcomeLoader = useAuthStore((state) => state.showWelcomeLoader);
  const dismissWelcomeLoader = useAuthStore((state) => state.dismissWelcomeLoader);
  const didRefreshSession = useRef(false);

  // Revalida la sessionData persistida contra el backend una sola vez por carga de página,
  // sin pantalla de carga: la copia de `localStorage` cubre el intervalo. `getState()` para
  // no suscribir `AppRoot` a `refreshSession` ni a sus cambios de `sessionData`.
  useEffect(() => {
    if (didRefreshSession.current) return;
    didRefreshSession.current = true;
    void useAuthStore.getState().refreshSession();
  }, []);

  return (
    <>
      <Outlet />
      {showWelcomeLoader && <WelcomeLoader onComplete={dismissWelcomeLoader} />}
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: '#ECFDF5', // green-50
              color: '#065F46', // green-800
            },
          },
          error: {
            style: {
              background: '#FEF2F2', // red-50
              color: '#991B1B', // red-800
            },
          },
        }}
      />
    </>
  );
}
