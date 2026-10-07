import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentValuationTable from "../components/StudentValuationTable";
import { useDeleteValuationMutation } from "../queries/useStudentValuationQuery";
import { useUsersQuery } from "../../users/queries/useUsersQuery";
import { ITEMS_PER_PAGE } from "../../../components/common/DataTable";
import { extractErrorMessage } from "../../../api/apiClient";
import { usePermissions } from "../../auth/usePermissions";
import { useActivePeriod } from "../../period/useActivePeriod";
import { useLetterAvailabilityQuery } from "../../report/queries/useReportQuery";
import { useInstitutionSettingsQuery } from "../../institution/queries/useInstitutionQuery";
import StudentValuationDetail from "../components/StudentValuationDetail";
import SearchFilterBar, { type FilterGroup } from "../../../components/common/SearchFilterBar";
import {
  getValuationState,
  VALUATION_STATE_ORDER,
  VALUATION_STATE_LABELS,
} from "../types/domain";
import { normalizeText } from "../../../utils/normalizeText";
import { useTableFilters } from "@/stores/useTableFiltersStore";
import type { UserDto, UserSchool } from "../../users/types";
import type { GradeLevel } from "@/types/domain";
import { useOfferedLevels } from "@/features/institution/queries/useOfferedLevels";


const NO_USERS: UserDto[] = [];
// Misma key que `UsersPage` (pestaña Estudiantes) e `/informes`: una sola caché compartida.
const STUDENTS_QUERY = { role: "Estudiante" } as const;

export default function StudentValuationsPage() {
  const { levels: offeredLevels } = useOfferedLevels();
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useInstitutionSettingsQuery();
  const { isAreaLead, schoolId } = usePermissions();
  const activePeriod = useActivePeriod();
  const { data: users = NO_USERS, isPending, error } = useUsersQuery(STUDENTS_QUERY);
  const { data: letterAvailability } = useLetterAvailabilityQuery(activePeriod?._id);
  const deleteValuation = useDeleteValuationMutation();

  // Búsqueda, filtros y página sobreviven a la navegación (store de UI, en memoria).
  const table = useTableFilters("valuations");
  const { search, initDefaults } = table;
  const selectedGrades = table.selectedOf("grade");
  const selectedSchools = table.selectedOf("school");
  const selectedStates = table.selectedOf("state");

  const schools = useMemo(() => {
    const bySchoolId = new Map<string, UserSchool>();
    users.forEach((user) => bySchoolId.set(user.school._id, user.school));
    return Array.from(bySchoolId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  // Default de sede propia del Jefe de Área: una vez por sesión; si la quita, no se re-aplica.
  useEffect(() => {
    if (!isAreaLead || !schoolId || schools.length === 0) return;
    initDefaults(schools.some((s) => s._id === schoolId) ? { school: [schoolId] } : {});
  }, [isAreaLead, schoolId, schools, initDefaults]);

  const filteredUsers = useMemo(() => {
    const term = normalizeText(search);
    return users.filter((user) => {
      const fullName = [user.firstName, user.middleName, user.lastName, user.secondLastName]
        .filter(Boolean)
        .join(" ");
      const matchesSearch =
        term === "" ||
        normalizeText(fullName).includes(term) ||
        String(user.identificationNumber).includes(term);
      const matchesGrade =
        selectedGrades.length === 0 || user.gradesTaught.some((g) => selectedGrades.includes(g as GradeLevel));
      const matchesSchool = selectedSchools.length === 0 || selectedSchools.includes(user.school._id);
      const matchesState =
        selectedStates.length === 0 || selectedStates.includes(getValuationState(user.valuations[0]?.status));
      return matchesSearch && matchesGrade && matchesSchool && matchesState;
    });
  }, [users, search, selectedGrades, selectedSchools, selectedStates]);

  const filterGroups: FilterGroup[] = [
    {
      id: "grade",
      label: "Grado",
      options: offeredLevels.map((grade) => ({ value: grade, label: grade })),
      selected: selectedGrades,
      onToggle: table.toggle("grade"),
    },
    {
      id: "state",
      label: "Estado",
      options: VALUATION_STATE_ORDER.map((state) => ({ value: state, label: VALUATION_STATE_LABELS[state] })),
      selected: selectedStates,
      onToggle: table.toggle("state"),
    },
    ...(isAreaLead
      ? [
          {
            id: "school",
            label: "Sede",
            options: schools.map((school) => ({ value: school._id, label: school.name })),
            selected: selectedSchools,
            onToggle: table.toggle("school"),
          } satisfies FilterGroup,
        ]
      : []),
  ];

  // Render detail view if a student is selected via URL
  if (studentId) {
    // `key`: un cambio de estudiante monta un detalle nuevo, sin arrastrar el borrador anterior.
    return <StudentValuationDetail key={studentId} />;
  }

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  // La página guardada puede quedar fuera de rango si la lista se reduce.
  const currentPage = Math.min(table.page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleOpenChecklist = (id: string) => {
    navigate(`/evaluacion/${id}`);
  };

  const handleViewLetter = (studentId: string, valuationId: string) => {
    navigate(`/evaluacion/${studentId}/carta-comunicativa/${valuationId}`);
  };

  return (
    <div className="w-full relative">
      <h1 className="mb-4 text-2xl font-semibold text-purple-900">
        Evaluación de estudiantes
      </h1>

      <div className="flex">
        <SearchFilterBar
          search={search}
          onSearchChange={table.setSearch}
          placeholder="Buscar por nombre o identificación"
          groups={filterGroups}
        />
      </div>

      <StudentValuationTable
        users={paginatedUsers}
        isLoading={isPending}
        error={error ? extractErrorMessage(error, "Falló la carga de usuarios.") : null}
        onDeleteValuation={async (valuationId) => {
          await deleteValuation.mutateAsync(valuationId);
        }}
        onOpenChecklist={handleOpenChecklist}
        onViewLetter={handleViewLetter}
        isLetterEnabled={settings?.enabledReports.includes("communicative-letter") ?? false}
        isLetterAvailable={letterAvailability?.isAvailable ?? false}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={() => table.setPage(Math.min(totalPages, currentPage + 1))}
        onPrevPage={() => table.setPage(Math.max(1, currentPage - 1))}
      />
    </div>
  );
}
