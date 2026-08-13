import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentValuationTable from "../components/StudentValuationTable";
import { useStudentValuationStore, ITEMS_PER_PAGE } from "../useStudentValuationStore";
import { useAuthStore } from "../../auth/useAuthStore";
import StudentValuationDetail from "../components/StudentValuationDetail";
import SearchFilterBar, { type FilterGroup } from "../../../components/common/SearchFilterBar";
import {
  getValuationState,
  VALUATION_STATE_ORDER,
  VALUATION_STATE_LABELS,
  type ValuationState,
} from "../types/domain";
import { normalizeText } from "../../../utils/normalizeText";
import type { SchoolDto } from "../types";
import type { GradeLevel } from "@/types/domain";

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];

export default function StudentValuationsPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { fetchUsers, users } = useStudentValuationStore();
  const { sessionData } = useAuthStore();

  const [search, setSearch] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<GradeLevel[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<ValuationState[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users when component mounts or when navigating back to list
  useEffect(() => {
    const user = sessionData?.user;
    // Only fetch if we are in the list view (no studentId)
    // allowing the list to be fresh when we return.
    if (user && !studentId) {
      fetchUsers({
        role: "Estudiante",
      });
    }
  }, [sessionData?.user, fetchUsers, studentId]);

  const schools = useMemo(() => {
    const bySchoolId = new Map<string, SchoolDto>();
    users.forEach((user) => bySchoolId.set(user.school._id, user.school));
    return Array.from(bySchoolId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

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
    {
      id: "school",
      label: "Sede",
      options: schools.map((school) => ({ value: school._id, label: school.name })),
      selected: selectedSchools,
      onToggle: (value) =>
        setSelectedSchools((prev) => (prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value])),
    },
  ];

  // Render detail view if a student is selected via URL
  if (studentId) {
    return <StudentValuationDetail />;
  }

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleOpenChecklist = (id: string) => {
    navigate(`/evaluacion/${id}`);
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
        onOpenChecklist={handleOpenChecklist}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
      />
    </div>
  );
}
