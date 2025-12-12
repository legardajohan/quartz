import React, { useEffect, useState } from "react";
import StudentValuationTable from "../components/StudentValuationTable";
import ValuationChecklist from "../components/ValuationChecklist";
import { useStudentValuationStore } from "../useStudentValuationStore";
import { useAuthStore } from "../../auth/useAuthStore";
import { apiPost } from "../../../api/apiClient";
import { FormModal } from "../../../components/common/FormModal";
import type {
  IStudentValuationDTO,
  LearningValuationUpdate,
  StudentValuationUpdateData,
} from "../types";

export default function StudentValuationsPage() {
  const { fetchUsers, users, updateValuation } = useStudentValuationStore();
  const { sessionData } = useAuthStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [valuationDto, setValuationDto] = useState<IStudentValuationDTO | null>(
    null
  );
  const [openSubjectId, setOpenSubjectId] = useState<string | null>(null);

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

  const handleOpenChecklist = async (studentId: string) => {
    const activePeriod = sessionData?.periods?.find((p) => p.isActive);
    if (!activePeriod) {
      console.warn("No active period found in sessionData.periods");
      return;
    }

    const url = `/student-valuations/student/${studentId}/period/${activePeriod._id}`;
    try {
      const data = await apiPost<IStudentValuationDTO>(url, {});
      setValuationDto(data);
      setModalOpen(true);
      setOpenSubjectId(data.valuationsBySubject?.[0]?.subjectId ?? null);
    } catch (err) {
      console.error("Error fetching student valuation:", err);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setValuationDto(null);
    setOpenSubjectId(null);
  };

  const handleSaveValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valuationDto) return;

    try {
      // 1. Transform the data to the required format for the PATCH request
      const payload: StudentValuationUpdateData = {
        valuationsBySubject: valuationDto.valuationsBySubject
          .map((subject) => ({
            subjectId: subject.subjectId,
            learningValuations: subject.learningValuations.filter(
              (lv) => lv.qualitativeValuation !== null
            ),
          }))
          .filter((subject) => subject.learningValuations.length > 0),
      };

      // 2. Call the update action from the store
      await updateValuation(valuationDto._id, payload);

      // 3. Close modal on success
      handleModalClose();
    } catch (err) {
      console.error("Error saving valuation:", err);
      // Optional: show an error message to the user
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <StudentValuationTable
        users={users}
        onOpenChecklist={handleOpenChecklist}
      />

      {valuationDto && (
        <FormModal
          open={modalOpen}
          onClose={handleModalClose}
          onSubmit={handleSaveValuation}
          size="xl"
          title={`Lista de chequeo - ${
            valuationDto.studentName?.firstName ?? ""
          } ${valuationDto.studentName?.lastName ?? ""}`}
          submitText="Guardar"
          cancelText="Cerrar"
        >
          {valuationDto.valuationsBySubject.map((subject) => (
            <div key={subject.subjectId} className="mb-4">
              <ValuationChecklist
                subject={subject}
                open={openSubjectId === subject.subjectId}
                onToggle={() =>
                  setOpenSubjectId(
                    openSubjectId === subject.subjectId
                      ? null
                      : subject.subjectId
                  )
                }
                initialSelections={subject.learningValuations.reduce(
                  (acc, lv) => {
                    acc[lv.learningId] = lv.qualitativeValuation;
                    return acc;
                  },
                  {} as Record<string, string | null>
                )}
                onChange={(learningId, qualitativeValuation) => {
                  setValuationDto((prev) => {
                    if (!prev) return prev;
                    const next = {
                      ...prev,
                      valuationsBySubject: prev.valuationsBySubject.map((s) => {
                        if (s.subjectId !== subject.subjectId) return s;
                        return {
                          ...s,
                          learningValuations: s.learningValuations.map((lv) =>
                            lv.learningId === learningId
                              ? {
                                  ...lv,
                                  qualitativeValuation:
                                    qualitativeValuation as LearningValuationUpdate["qualitativeValuation"],
                                }
                              : lv
                          ),
                        };
                      }),
                    };
                    return next;
                  });
                }}
              />
            </div>
          ))}
        </FormModal>
      )}
    </div>
  );
}
