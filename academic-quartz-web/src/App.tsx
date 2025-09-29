import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './components/router/ProtectedRoute';
import { useAuthStore } from './features/auth/useAuthStore';
import { SidebarMenu } from './components/layouts/SidebarMenu';

// El Layout de la aplicación que contiene el menú y el contenido principal
const AppLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <SidebarMenu />
      <main style={{ flexGrow: 1 }}>
        <Outlet /> {/* Aquí se renderizarán las páginas anidadas */}
      </main>
    </div>
  );
};

// Placeholder para un futuro Dashboard
const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Bienvenido al Dashboard, {user?.firstName || 'Usuario'}!</h1>
      <p>Esta es una ruta protegida.</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS */}
      <Route path="/login" element={<LoginPage />} />

      {/* RUTAS PROTEGIDAS CON LAYOUT */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Todas las rutas aquí dentro tendrán el menú lateral */}
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Ejemplo: <Route path="/learnings" element={<LearningsPage />} /> */}
        </Route>
      </Route>

      {/* REDIRECCIÓN PRINCIPAL */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* RUTA NOT FOUND (404) */}
      <Route path="*" element={<div>404 - Página no encontrada</div>} />
    </Routes>
  );
}

export default App;

