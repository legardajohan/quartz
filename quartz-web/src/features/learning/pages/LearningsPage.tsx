import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useLearningStore } from "../useLearningStore";
import { useAuthStore } from "../../auth/useAuthStore";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import { Learning, NewLearning, UpdateLearning } from "../types";
import { LearningForm } from "../components/LearningForm";
import { LearningsTable } from "../components/LearningsTable";
import { LearningsFilters } from "../components/LearningsFilters";
import { ITEMS_PER_PAGE } from "../../../components/common/DataTable";

export default function LearningsPage() {
  const { learnings, isLoading, isSubmitting, error, createLearning, updateLearning, deleteLearning } =
    useLearningStore();
  const { sessionData } = useAuthStore();

  const subjects = sessionData?.subjects ?? [];
  const periods = sessionData?.periods ?? [];

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [learningFormData, setLearningFormData] = useState<Omit<NewLearning, 'grade'> | null>(null);
  const [selectedLearning, setSelectedLearning] = useState<Learning | null>(null);
  const [learningToDelete, setLearningToDelete] = useState<Learning | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Filters
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const hasInitializedFilter = useRef(false);

  useEffect(() => {
    useLearningStore.getState().fetchLearnings();
  }, []);

  // Set default active period filter
  useEffect(() => {
    if (!hasInitializedFilter.current && periods.length > 0) {
      const activePeriod = periods.find(p => p.isActive);
      if (activePeriod) {
        setSelectedPeriods([activePeriod._id]);
      }
      hasInitializedFilter.current = true;
    }
  }, [periods]);

  const handleOpenCreateModal = () => {
    setSelectedLearning(null);
    setFormModalOpen(true);
  }

  const handleEdit = (learning: Learning) => {
    setSelectedLearning(learning);
    setFormModalOpen(true);
  };

  const handleDelete = (learning: Learning) => {
    setLearningToDelete(learning);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setDeleteModalOpen(false);
    setLearningToDelete(null);
    setFormModalOpen(false);
    setSelectedLearning(null);
    setIsFormDirty(false);
  };

  const handleConfirmDelete = () => {
    if (!learningToDelete) return;

    const promise = deleteLearning(learningToDelete._id);
    toast.promise(promise, {
      loading: "Eliminando aprendizaje...",
      success: <b>Aprendizaje eliminado con éxito</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
    handleCloseModals();
  };

  const handleFormChange = useCallback((formData: Omit<NewLearning, 'grade'>, isDirty: boolean) => {
    setLearningFormData(formData);
    setIsFormDirty(isDirty);
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!learningFormData || !learningFormData.subjectId || !learningFormData.periodId || !learningFormData.description) {
      toast.error("Por favor, completa todos los campos del formulario.");
      return;
    }

    let promise;
    if (selectedLearning) {
      const learningToUpdate: UpdateLearning = {
        ...learningFormData,
      };
      promise = updateLearning(selectedLearning._id, learningToUpdate);
      toast.promise(promise, {
        loading: "Actualizando aprendizaje...",
        success: <b>¡Aprendizaje actualizado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    } else {
      const learningToCreate: NewLearning = {
        ...learningFormData,
        grade: "Transición",
      };
      promise = createLearning(learningToCreate);
      toast.promise(promise, {
        loading: "Creando aprendizaje...",
        success: <b>¡Aprendizaje creado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    }

    handleCloseModals();
  };

  const togglePeriodFilter = (periodId: string) => {
    setSelectedPeriods(prev =>
      prev.includes(periodId)
        ? prev.filter(id => id !== periodId)
        : [...prev, periodId]
    );
    setCurrentPage(1);
  };

  const toggleSubjectFilter = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
    setCurrentPage(1);
  };

  const filteredLearnings = useMemo(() => {
    return learnings.filter(learning => {
      const matchPeriod = selectedPeriods.length === 0 || selectedPeriods.includes(learning.period._id);
      const matchSubject = selectedSubjects.length === 0 || selectedSubjects.includes(learning.subject._id);
      return matchPeriod && matchSubject;
    });
  }, [learnings, selectedPeriods, selectedSubjects]);

  const totalPages = Math.ceil(filteredLearnings.length / ITEMS_PER_PAGE);
  const paginatedLearnings = filteredLearnings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedLearning;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  return (
    <>
      <div className="w-full relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-purple-900">
              Gestión de Aprendizajes Esperados
            </h1>

            <LearningsFilters
              periods={periods}
              subjects={subjects}
              selectedPeriods={selectedPeriods}
              selectedSubjects={selectedSubjects}
              onTogglePeriod={togglePeriodFilter}
              onToggleSubject={toggleSubjectFilter}
            />
          </div>

          <button
            onClick={handleOpenCreateModal}
            aria-label="Crear nuevo aprendizaje"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
          >
            <PlusIcon className="h-6 w-6" strokeWidth={2} />
            Crear
          </button>
        </div>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        <LearningsTable
          learnings={paginatedLearnings}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          onPrevPage={() => setCurrentPage(p => Math.max(1, p - 1))}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        title="¿Deseas eliminar el aprendizaje?"
        body={learningToDelete?.description ?? ''}
        confirmColor="pink"
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        title={!isEditMode ? "Nuevo Aprendizaje" : "Editar Aprendizaje"}
        subtitle={!isEditMode ? "Completa los datos para registrar un nuevo aprendizaje esperado." : "Actualiza los datos del aprendizaje."}
        submitText={!isEditMode ? "Crear Aprendizaje" : "Actualizar"}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
      >
        <LearningForm
          initialData={selectedLearning}
          onFormChange={handleFormChange}
          subjects={subjects}
          periods={periods}
        />
      </FormModal>
    </>
  );
}