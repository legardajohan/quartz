import { useState } from "react";
import ReportsTable from "./ReportsTable";
import ChecklistReportModal from "./ChecklistReportModal";
import CommunicativeLetterModal from "./CommunicativeLetterModal";
import { useLetterAvailabilityQuery } from "../queries/useReportQuery";
import { useUsersQuery } from "../../users/queries/useUsersQuery";
import { ITEMS_PER_PAGE } from "../../../components/common/DataTable";
import { useActivePeriod } from "../../period/useActivePeriod";
import { useInstitutionSettingsQuery } from "../../institution/queries/useInstitutionQuery";
import { normalizeText } from "../../../utils/normalizeText";
import { useTableFilters } from "@/stores/useTableFiltersStore";
import { REPORT_KIND_VALUES, type GradeLevel, type ReportKind } from "@/types/domain";
import type { UserDto } from "../../users/types";

const NO_USERS: UserDto[] = [];
const STUDENTS_QUERY = { role: "Estudiante" } as const;
// Sin ajustes (aún no llegan o falló la request) se asume el default del backend: ambos informes.
const DEFAULT_ENABLED_REPORTS: ReportKind[] = [...REPORT_KIND_VALUES];

interface IndividualReportsPanelProps {
  search: string;
  selectedGrades: string[];
  selectedSchools: string[];
}

export default function IndividualReportsPanel({ search, selectedGrades, selectedSchools }: IndividualReportsPanelProps) {
  const { data: settings } = useInstitutionSettingsQuery();

  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedLetterValuationId, setSelectedLetterValuationId] = useState<string | null>(null);
  const [selectedLetterStudentName, setSelectedLetterStudentName] = useState("");

  const activePeriodId = useActivePeriod()?._id;
  const { data: users = NO_USERS, isPending: isLoading } = useUsersQuery(STUDENTS_QUERY);
  const { data: letterAvailability } = useLetterAvailabilityQuery(activePeriodId);

  // La página vive en la tabla "reports" (dueña: `ReportsPage`); el store ya la vuelve a 1 al
  // cambiar búsqueda o filtros.
  const table = useTableFilters("reports");

  const term = normalizeText(search);
  const filteredUsers = users.filter((user) => {
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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  // La página guardada puede quedar fuera de rango si la lista se reduce.
  const currentPage = Math.min(table.page, totalPages);
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
      <ReportsTable
        users={paginatedUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={() => table.setPage(Math.min(totalPages, currentPage + 1))}
        onPrevPage={() => table.setPage(Math.max(1, currentPage - 1))}
        isLoading={isLoading}
        onViewChecklist={handleViewChecklist}
        onViewLetter={handleViewLetter}
        enabledReports={settings?.enabledReports ?? DEFAULT_ENABLED_REPORTS}
        isLetterAvailable={letterAvailability?.isAvailable ?? false}
        activePeriodId={activePeriodId}
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
