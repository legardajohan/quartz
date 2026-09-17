import { useEffect, useState } from "react";
import ReportsTable from "./ReportsTable";
import ChecklistReportModal from "./ChecklistReportModal";
import CommunicativeLetterModal from "./CommunicativeLetterModal";
import { useReportStore, ITEMS_PER_PAGE } from "../useReportStore";
import { useAuthStore } from "../../auth/useAuthStore";
import { useActivePeriod } from "../../period/useActivePeriod";
import { normalizeText } from "../../../utils/normalizeText";
import type { GradeLevel } from "@/types/domain";

interface IndividualReportsPanelProps {
  search: string;
  selectedGrades: GradeLevel[];
  selectedSchools: string[];
}

export default function IndividualReportsPanel({ search, selectedGrades, selectedSchools }: IndividualReportsPanelProps) {
  const { users, isLoading, fetchUsers, fetchLetterAvailability, letterAvailability } = useReportStore();
  const { sessionData } = useAuthStore();

  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedLetterValuationId, setSelectedLetterValuationId] = useState<string | null>(null);
  const [selectedLetterStudentName, setSelectedLetterStudentName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const activePeriodId = useActivePeriod()?._id;

  useEffect(() => {
    if (sessionData?.user) {
      fetchUsers({ role: "Estudiante" });
    }
  }, [sessionData?.user, fetchUsers]);

  useEffect(() => {
    if (activePeriodId) {
      fetchLetterAvailability(activePeriodId);
    }
  }, [activePeriodId, fetchLetterAvailability]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedGrades, selectedSchools]);

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
        onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
        isLoading={isLoading}
        onViewChecklist={handleViewChecklist}
        onViewLetter={handleViewLetter}
        enabledReports={sessionData?.enabledReports ?? ['checklist', 'communicative-letter']}
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
