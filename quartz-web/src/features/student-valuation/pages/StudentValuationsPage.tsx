import { useEffect, useMemo, useRef, useState } from "react";
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
  type ValuationState,
} from "../types/domain";
import { normalizeText } from "../../../utils/normalizeText";
import type { UserDto, UserSchool } from "../../users/types";
import type { GradeLevel } from "@/types/domain";

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];

const NO_USERS: UserDto[] = [];
// Misma key que `UsersPage` (pestaña Estudiantes) e `/informes`: una sola caché compartida.
const STUDENTS_QUERY = { role: "Estudiante" } as const;

export default function StudentValuationsPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useInstitutionSettingsQuery();
  const { isAreaLead, schoolId } = usePermissions();
  const activePeriod = useActivePeriod();
  const { data: users = NO_USERS, isPending, error } = useUsersQuery(STUDENTS_QUERY);
  const { data: letterAvailability } = useLetterAvailabilityQuery(activePeriod?._id);
  const deleteValuation = useDeleteValuationMutation();

  const [search, setSearch] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<GradeLevel[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<ValuationState[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const hasInitializedSchoolFilter = useRef(false);

  const schools = useMemo(() => {
    const bySchoolId = new Map<string, UserSchool>();
    users.forEach((user) => bySchoolId.set(user.school._id, user.school));
    return Array.from(bySchoolId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  useEffect(() => {
    if (hasInitializedSchoolFilter.current || !isAreaLead || !schoolId || schools.length === 0) return;
    if (schools.some((s) => s._id === schoolId)) setSelectedSchools([schoolId]);
    hasInitializedSchoolFilter.current = true;
  }, [isAreaLead, schoolId, schools]);

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
      options: GRADE_LEVELS.map((grade) => ({ value: grade, label: grade })),
      selected: selectedGrades,
      onToggle: (value) =>
        setSelectedGrades((prev) =>
          prev.includes(value as GradeLevel) ? prev.filter((g) => g !== value) : [...prev, value as GradeLevel]
        ),
    },
    {
      id: "state",
      label: "Estado",
      options: VALUATION_STATE_ORDER.map((state) => ({ value: state, label: VALUATION_STATE_LABELS[state] })),
      selected: selectedStates,
      onToggle: (value) =>
        setSelectedStates((prev) =>
          prev.includes(value as ValuationState) ? prev.filter((s) => s !== value) : [...prev, value as ValuationState]
        ),
    },
    ...(isAreaLead
      ? [
          {
            id: "school",
            label: "Sede",
            options: schools.map((school) => ({ value: school._id, label: school.name })),
            selected: selectedSchools,
            onToggle: (value) =>
              setSelectedSchools((prev) =>
                prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]
              ),
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
          onSearchChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
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
        onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
      />
    </div>
  );
}
