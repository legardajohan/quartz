import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './components/router/ProtectedRoute';
import { Dashboard } from './components/layouts/Dashboard';
import LearningsPage from './features/learning/pages/LearningsPage';
import ConceptsPage from './features/concept/pages/ConceptsPage';
import ChecklistsPage from './features/checklist/pages/ChecklistsPage';
import EvaluationsPage from './features/evaluation/pages/EvaluationsPage';
import ReportsPage from './features/report/pages/ReportsPage';
import UsersPage from './features/user/pages/UsersPage';
import ConsolidatedPage from './features/consolidated/pages/ConsolidatedPage';

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
          <Route path="/academico/aprendizajes" element={<LearningsPage />} />
          <Route path="/academico/conceptos" element={<ConceptsPage />} />
          <Route path="/academico/lista-chequeo" element={<ChecklistsPage />} />

          <Route path="/evaluacion" element={<EvaluationsPage />} />
          <Route path="/informes" element={<ReportsPage />} />
          <Route path="/gestion/usuarios" element={<UsersPage />} />
          <Route path="/gestion/consolidados" element={<ConsolidatedPage />} />
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
