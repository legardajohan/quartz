import { useEffect, useState } from "react";
import ReportsTable from "../components/ReportsTable";
import ChecklistReportModal from "../components/ChecklistReportModal";
import { useReportStore, ITEMS_PER_PAGE } from "../useReportStore";
import { useAuthStore } from "../../auth/useAuthStore";

export default function ReportsPage() {
  const { users, isLoading, currentPage, fetchUsers, nextPage, prevPage } = useReportStore();
  const { sessionData } = useAuthStore();

  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");

  useEffect(() => {
    if (sessionData?.user) {
      fetchUsers({ role: "Estudiante" });
    }
  }, [sessionData?.user, fetchUsers]);

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-purple-900">Informes</h1>
      <p className="mt-1 text-sm text-gray-600">
        Consulta y descarga la Lista de Chequeo evaluada de tus estudiantes.
      </p>
      <ReportsTable
        users={paginatedUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        isLoading={isLoading}
        onViewChecklist={handleViewChecklist}
      />
      <ChecklistReportModal
        open={!!selectedValuationId}
        valuationId={selectedValuationId}
        studentName={selectedStudentName}
        onClose={() => setSelectedValuationId(null)}
      />
    </div>
  );
}
