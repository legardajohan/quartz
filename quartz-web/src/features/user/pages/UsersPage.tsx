import { useUsersQuery } from '../queries/useUsersQuery';
import { Loading } from '@/components/ui/Loading';

const ROLE_LABELS: Record<string, string> = {
  'Jefe de Área': 'Jefe de Área',
  'Docente': 'Docente',
  'Estudiante': 'Estudiante',
};

export default function UsersPage() {
  const { data: users, isLoading, isError, error } = useUsersQuery();

  if (isLoading) return <Loading message="Cargando usuarios..." />;

  if (isError) {
    const message = error instanceof Error ? error.message : 'Error al cargar usuarios.';
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-500 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-blue-gray-800 mb-6">
        Usuarios
      </h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sede
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grados a cargo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {user.school?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {user.gradesTaught?.length > 0
                        ? user.gradesTaught.join(', ')
                        : '—'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {users && (
        <p className="mt-3 text-xs text-gray-400 text-right">
          {users.length} usuario{users.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
