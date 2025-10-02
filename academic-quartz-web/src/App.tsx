import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './components/router/ProtectedRoute';
import { Dashboard } from './components/layouts/Dashboard';

// Placeholder para un futuro Dashboard
const DashboardPage = () => {
  return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-blue-gray-800">
          Contenido Principal
        </h1>
        <p className="mt-2 text-gray-600">
          El contenido de la página se ajustará automáticamente cuando el menú
          lateral se abra o se cierre.
        </p>
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
        <Route element={<Dashboard><Outlet /></Dashboard>}>
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
