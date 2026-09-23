import { lazy, Suspense, useEffect, useRef } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import ActivateAccountPage from './features/auth/pages/ActivateAccountPage';
import { useAuthStore } from './features/auth/useAuthStore';
import { WelcomeLoader } from './features/auth/components/WelcomeLoader';
import { ProtectedRoute } from './components/router/ProtectedRoute';
import { RoleRoute } from './components/router/RoleRoute';
import { Dashboard } from './components/layouts/Dashboard';
import { Loading } from './components/ui/Loading';
import LearningsPage from './features/learning/pages/LearningsPage';
import ConceptsPage from './features/concept/pages/ConceptsPage';
import ChecklistsPage from './features/checklist-template/pages/ChecklistsPage';
import StudentValuationsPage from './features/student-valuation/pages/StudentValuationsPage';
import UsersPage from './features/users/pages/UsersPage';
import ConfigurationPage from './features/configuration/pages/ConfigurationPage';
import ProfilePage from './features/account/pages/ProfilePage';
import ChangePasswordPage from './features/account/pages/ChangePasswordPage';
import { Toaster } from 'react-hot-toast';

// @react-pdf/renderer y los assets base64 del informe solo se cargan cuando el usuario
// visita una de estas dos pantallas, no en el bundle inicial.
const ReportsPage = lazy(() => import('./features/report/pages/ReportsPage'));
const CommunicativeLetterEditPage = lazy(() => import('./features/report/pages/CommunicativeLetterEditPage'));
// Recharts solo se descarga al entrar a /dashboard, no en el bundle inicial (INF-04).
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));

// El spinner vive sobre el fondo del Dashboard, sin velo ni tarjeta: mismo envoltorio que usa
// `DataTable` mientras carga, para que la espera del chunk y la de los datos se vean idénticas.
const routeFallback = (
  <div className="flex h-64 w-full items-center justify-center">
    <Loading />
  </div>
);

const AppRoot = () => {
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
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppRoot />}>
      {/* RUTAS PÚBLICAS */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activar-cuenta" element={<ActivateAccountPage />} />

      {/* RUTAS PROTEGIDAS CON LAYOUT */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Dashboard><Outlet /></Dashboard>}>
          {/* Todas las rutas aquí dentro tendrán el menú lateral */}
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={routeFallback}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route path="/academico/aprendizajes" element={<LearningsPage />} />
          <Route path="/academico/conceptos" element={<ConceptsPage />} />
          <Route path="/academico/lista-chequeo" element={<ChecklistsPage />} />

          <Route path="/evaluacion" element={<StudentValuationsPage />} />
          <Route path="/evaluacion/:studentId" element={<StudentValuationsPage />} />
          <Route
            path="/evaluacion/:studentId/carta-comunicativa/:valuationId"
            element={
              <Suspense fallback={routeFallback}>
                <CommunicativeLetterEditPage />
              </Suspense>
            }
          />
          <Route
            path="/informes"
            element={
              <Suspense fallback={routeFallback}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route path="/gestion/usuarios" element={<UsersPage />} />
          <Route path="/mi-cuenta" element={<Navigate to="/mi-cuenta/perfil" replace />} />
          <Route path="/mi-cuenta/perfil" element={<ProfilePage />} />
          <Route path="/mi-cuenta/contrasena" element={<ChangePasswordPage />} />

          <Route element={<RoleRoute allowedRoles={['Jefe de Área']} />}>
            <Route path="/gestion/configuracion" element={<ConfigurationPage />} />
          </Route>
        </Route>
      </Route>

      {/* REDIRECCIÓN PRINCIPAL */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* RUTA NOT FOUND (404) */}
      <Route path="*" element={<div>404 - Página no encontrada</div>} />
    </Route>
  )
);
