import { useEffect } from "react";
import StudentValuationTable from "../components/StudentValuationTable";
import { useStudentValuationStore } from "../useStudentValuationStore";
import { useAuthStore } from "../../auth/useAuthStore";

export default function StudentValuationsPage() {
  const { fetchUsers, users } = useStudentValuationStore();
  const { sessionData } = useAuthStore();

  // Fetch users when component mounts
  useEffect(() => {
    const schoolId = sessionData?.user.schoolId;
    if (schoolId) {
      fetchUsers({
        role: "Estudiante",
        schoolId: schoolId,
      });
    }
  }, [sessionData?.user.schoolId, fetchUsers]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <StudentValuationTable users={users} />
    </div>
  );
}
