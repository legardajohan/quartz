import { useEffect, useState } from "react";
import ReportsTable from "../components/ReportsTable";
import ChecklistReportModal from "../components/ChecklistReportModal";
import CommunicativeLetterModal from "../components/CommunicativeLetterModal";
import { useReportStore, ITEMS_PER_PAGE } from "../useReportStore";
import { useAuthStore } from "../../auth/useAuthStore";

export default function ReportsPage() {
  const {
    users,
    isLoading,
    currentPage,
    fetchUsers,
    nextPage,
    prevPage,
    fetchLetterAvailability,
    letterAvailability,
  } = useReportStore();
  const { sessionData } = useAuthStore();

  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedLetterValuationId, setSelectedLetterValuationId] = useState<string | null>(null);
  const [selectedLetterStudentName, setSelectedLetterStudentName] = useState("");

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

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      <ReportsTable
        users={paginatedUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={nextPage}
        onPrevPage={prevPage}
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
