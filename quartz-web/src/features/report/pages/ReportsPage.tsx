import { useEffect, useMemo, useState } from "react";
import ReportsTable from "../components/ReportsTable";
import ChecklistReportModal from "../components/ChecklistReportModal";
import CommunicativeLetterModal from "../components/CommunicativeLetterModal";
import { useReportStore, ITEMS_PER_PAGE } from "../useReportStore";
import { useAuthStore } from "../../auth/useAuthStore";
import SearchFilterBar, { type FilterGroup } from "../../../components/common/SearchFilterBar";
import { normalizeText } from "../../../utils/normalizeText";
import type { SchoolDto } from "../../student-valuation/types";
import type { GradeLevel } from "@/types/domain";

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];

export default function ReportsPage() {
  const { users, isLoading, fetchUsers, fetchLetterAvailability, letterAvailability } = useReportStore();
  const { sessionData } = useAuthStore();

  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedLetterValuationId, setSelectedLetterValuationId] = useState<string | null>(null);
  const [selectedLetterStudentName, setSelectedLetterStudentName] = useState("");

  const [search, setSearch] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<GradeLevel[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (sessionData?.user) {
      fetchUsers({ role: "Estudiante" });
    }
  }, [sessionData?.user, fetchUsers]);

  useEffect(() => {
    const activePeriod = sessionData?.periods?.find((p) => p.isActive);
    if (activePeriod) {
      fetchLetterAvailability(activePeriod._id);
    }
  }, [sessionData?.periods, fetchLetterAvailability]);

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
      return matchesSearch && matchesGrade && matchesSchool;
    });
  }, [users, search, selectedGrades, selectedSchools]);

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
      id: "school",
      label: "Sede",
      options: schools.map((school) => ({ value: school._id, label: school.name })),
      selected: selectedSchools,
      onToggle: (value) =>
        setSelectedSchools((prev) => (prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value])),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleViewChecklist = (valuationId: string) => {
    const owner = users.find((user) => user.valuations.some((v) => v._id === valuationId));
    const name = owner
      ? [owner.firstName, owner.lastName, owner.secondLastName].filter(Boolean).join(" ")
      : "Estudiante";

    setSelectedStudentName(name);
    setSelectedValuationId(valuationId);
  };

  const handleViewLetter = (valuationId: string) => {
    const owner = users.find((user) => user.valuations.some((v) => v._id === valuationId));
    const name = owner
      ? [owner.firstName, owner.lastName, owner.secondLastName].filter(Boolean).join(" ")
      : "Estudiante";

    setSelectedLetterStudentName(name);
    setSelectedLetterValuationId(valuationId);
  };

  return (
    <div className="w-full relative">
      <h1 className="text-2xl font-semibold text-purple-900">Informes</h1>
      <p className="mt-1 text-sm text-gray-600">
        Consulta y descarga la Lista de Chequeo y la Carta Comunicativa de tus estudiantes.
      </p>

      <div className="mb-2 mt-4 flex">
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

      <ReportsTable
        users={paginatedUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
        isLoading={isLoading}
        onViewChecklist={handleViewChecklist}
        onViewLetter={handleViewLetter}
        enabledReports={sessionData?.enabledReports ?? ['checklist', 'communicative-letter']}
        isLetterAvailable={letterAvailability?.isAvailable ?? false}
      />
      <ChecklistReportModal
        open={!!selectedValuationId}
        valuationId={selectedValuationId}
        studentName={selectedStudentName}
        onClose={() => setSelectedValuationId(null)}
      />
      <CommunicativeLetterModal
        open={!!selectedLetterValuationId}
        valuationId={selectedLetterValuationId}
        studentName={selectedLetterStudentName}
        onClose={() => setSelectedLetterValuationId(null)}
      />
    </div>
  );
}
