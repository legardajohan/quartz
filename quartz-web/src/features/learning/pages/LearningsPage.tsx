import { useEffect, useState, useCallback, useMemo } from "react";
import { Typography } from "@material-tailwind/react";
import { PlusIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { extractErrorMessage } from "@/api/apiClient";
import {
  useLearningsQuery,
  useCreateLearningMutation,
  useUpdateLearningMutation,
  useDeleteLearningMutation,
} from "../queries/useLearningsQuery";
import { usePeriodsQuery } from "../../period/queries/usePeriodsQuery";
import { useSubjectsQuery } from "../../subject/queries/useSubjectsQuery";
import type { PeriodDto } from "../../period/types";
import type { Subject } from "@/types/domain";
import { usePermissions } from "../../auth/usePermissions";
import { useActivePeriod } from "../../period/useActivePeriod";
import { useSubjectAxisLabel } from "../../subject/useSubjectAxisLabel";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import SearchFilterBar, { type FilterGroup } from "../../../components/common/SearchFilterBar";
import { Learning, NewLearning, UpdateLearning } from "../types";
import { LearningForm } from "../components/LearningForm";
import { LearningsTable } from "../components/LearningsTable";
import { ITEMS_PER_PAGE } from "../../../components/common/DataTable";
import { normalizeText } from "../../../utils/normalizeText";
import { useTableFilters } from "@/stores/useTableFiltersStore";

const NO_LEARNINGS: Learning[] = [];
const NO_PERIODS: PeriodDto[] = [];
const NO_SUBJECTS: Subject[] = [];

export default function LearningsPage() {
  const { data: learnings = NO_LEARNINGS, isPending: isLoading, error: queryError } = useLearningsQuery();
  const createMutation = useCreateLearningMutation();
  const updateMutation = useUpdateLearningMutation();
  const deleteMutation = useDeleteLearningMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const error = queryError ? extractErrorMessage(queryError, "Falló la carga de aprendizajes.") : null;
  const { isAreaLead } = usePermissions();

  const { data: subjects = NO_SUBJECTS } = useSubjectsQuery();
  // Tras F5 la lista llega después del primer render: el default de periodo activo espera a ella.
  const { data: periods = NO_PERIODS } = usePeriodsQuery();
  const activePeriod = useActivePeriod();
  const axis = useSubjectAxisLabel();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [learningFormData, setLearningFormData] = useState<Omit<NewLearning, 'grade'> | null>(null);
  const [selectedLearning, setSelectedLearning] = useState<Learning | null>(null);
  const [learningToDelete, setLearningToDelete] = useState<Learning | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Búsqueda, filtros y página sobreviven a la navegación (store de UI, en memoria).
  const table = useTableFilters("learnings");
  const { search, initDefaults } = table;
  const selectedPeriods = table.selectedOf("period");
  const selectedSubjects = table.selectedOf("subject");

  // Default de periodo activo: una vez por sesión; si el usuario lo quita, no se re-aplica.
  useEffect(() => {
    if (periods.length > 0) {
      initDefaults(activePeriod ? { period: [activePeriod._id] } : {});
    }
  }, [periods, activePeriod, initDefaults]);

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

    const promise = deleteMutation.mutateAsync(learningToDelete._id);
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
      promise = updateMutation.mutateAsync({ id: selectedLearning._id, data: learningToUpdate });
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
      promise = createMutation.mutateAsync(learningToCreate);
      toast.promise(promise, {
        loading: "Creando aprendizaje...",
        success: <b>¡Aprendizaje creado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    }

    handleCloseModals();
  };

  const filteredLearnings = useMemo(() => {
    const term = normalizeText(search);
    return learnings.filter(learning => {
      const matchSearch = term === "" || normalizeText(learning.description).includes(term);
      const matchPeriod = selectedPeriods.length === 0 || selectedPeriods.includes(learning.period._id);
      const matchSubject = selectedSubjects.length === 0 || selectedSubjects.includes(learning.subject._id);
      return matchSearch && matchPeriod && matchSubject;
    });
  }, [learnings, search, selectedPeriods, selectedSubjects]);

  const learningFilterGroups: FilterGroup[] = [
    {
      id: "period",
      label: "Periodo",
      options: periods.map((period) => ({ value: period._id, label: period.name })),
      selected: selectedPeriods,
      onToggle: table.toggle("period"),
    },
    {
      id: "subject",
      label: axis.plural,
      options: subjects.map((subject) => ({ value: subject._id, label: subject.name })),
      selected: selectedSubjects,
      onToggle: table.toggle("subject"),
    },
  ];

  const totalPages = Math.ceil(filteredLearnings.length / ITEMS_PER_PAGE);
  // La página guardada puede quedar fuera de rango si la lista se reduce (p. ej. tras eliminar).
  const currentPage = Math.max(1, Math.min(table.page, totalPages));
  const paginatedLearnings = filteredLearnings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedLearning;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  const singleSelectedSubject =
    selectedSubjects.length === 1
      ? subjects.find((s) => s._id === selectedSubjects[0])
      : undefined;
  const isDescriptionModeSelected = singleSelectedSubject?.evaluationMode === "description";

  return (
    <>
      <div className="w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-purple-900">
            Gestión de Aprendizajes Esperados
          </h1>

          {isAreaLead && !isDescriptionModeSelected && (
            <button
              onClick={handleOpenCreateModal}
              aria-label="Crear nuevo aprendizaje"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
            >
              <PlusIcon className="h-6 w-6" strokeWidth={2} />
              Crear
            </button>
          )}
        </div>

        <div className="mb-6 flex">
          <SearchFilterBar
            search={search}
            onSearchChange={table.setSearch}
            placeholder="Buscar aprendizaje"
            groups={learningFilterGroups}
          />
        </div>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        {isDescriptionModeSelected ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
              <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <Typography variant="h6" color="blue-gray" className="font-bold">
              Descripción personalizada del desempeño por parte del docente
            </Typography>
            <Typography variant="small" className="max-w-md text-gray-500">
              {axis.singular} sin aprendizajes: se valora con una descripción libre del desempeño en la Lista de Chequeo.
            </Typography>
          </div>
        ) : (
          <LearningsTable
            learnings={paginatedLearnings}
            currentPage={currentPage}
            totalPages={totalPages}
            onNextPage={() => table.setPage(Math.min(totalPages, currentPage + 1))}
            onPrevPage={() => table.setPage(Math.max(1, currentPage - 1))}
            isLoading={isLoading}
            canManage={isAreaLead}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
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