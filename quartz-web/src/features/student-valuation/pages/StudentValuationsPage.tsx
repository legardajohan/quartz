import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentValuationTable from "../components/StudentValuationTable";
import { useStudentValuationStore, ITEMS_PER_PAGE } from "../useStudentValuationStore";
import { useAuthStore } from "../../auth/useAuthStore";
import StudentValuationDetail from "../components/StudentValuationDetail";

export default function StudentValuationsPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const {
    fetchUsers,
    users,
    currentPage,
    nextPage,
    prevPage
  } = useStudentValuationStore();
  const { sessionData } = useAuthStore();

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

  // Render detail view if a student is selected via URL
  if (studentId) {
    return <StudentValuationDetail />;
  }

  // Pagination logic
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleOpenChecklist = (id: string) => {
    navigate(`/evaluacion/${id}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-purple-900">
        Evaluación de estudiantes
      </h1>
      <StudentValuationTable
        users={paginatedUsers}
        onOpenChecklist={handleOpenChecklist}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </div>
  );
}
