import { useEffect, useState, useCallback, useMemo } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { extractErrorMessage } from "@/api/apiClient";
import {
  useConceptsQuery,
  useCreateConceptMutation,
  useUpdateConceptMutation,
  useDeleteConceptMutation,
} from "../queries/useConceptsQuery";
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
import { ConceptDto, NewConcept, UpdateConcept, QualitativeValuation } from "../types";
import { ConceptForm, ConceptFormData } from "../components/ConceptForm";
import { ConceptsTable } from "../components/ConceptsTable";
import { ITEMS_PER_PAGE } from "../../../components/common/DataTable";
import { normalizeText } from "../../../utils/normalizeText";
import { useTableFilters } from "@/stores/useTableFiltersStore";

const VALUATION_TYPES: QualitativeValuation[] = ["Logrado", "En proceso", "Con dificultad"];

const NO_CONCEPTS: ConceptDto[] = [];
const NO_PERIODS: PeriodDto[] = [];
const NO_SUBJECTS: Subject[] = [];

export default function ConceptsPage() {
  const { data: concepts = NO_CONCEPTS, isPending: isLoading, error: queryError } = useConceptsQuery();
  const createMutation = useCreateConceptMutation();
  const updateMutation = useUpdateConceptMutation();
  const deleteMutation = useDeleteConceptMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const error = queryError ? extractErrorMessage(queryError, "Falló la carga de conceptos.") : null;
  const { canManageOwned } = usePermissions();

  const { data: subjects = NO_SUBJECTS } = useSubjectsQuery();
  // Tras F5 la lista llega después del primer render: el default de periodo activo espera a ella.
  const { data: periods = NO_PERIODS } = usePeriodsQuery();
  const activePeriod = useActivePeriod();
  const axis = useSubjectAxisLabel();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [conceptFormData, setConceptFormData] = useState<ConceptFormData | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<ConceptDto | null>(null);
  const [conceptToDelete, setConceptToDelete] = useState<ConceptDto | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Búsqueda, filtros y página sobreviven a la navegación (store de UI, en memoria).
  const table = useTableFilters("concepts");
  const { search, initDefaults } = table;
  const selectedPeriods = table.selectedOf("period");
  const selectedSubjects = table.selectedOf("subject");
  const selectedValuationTypes = table.selectedOf("valuation");

  // Default de periodo activo: una vez por sesión; si el usuario lo quita, no se re-aplica.
  useEffect(() => {
    if (periods.length > 0) {
      initDefaults(activePeriod ? { period: [activePeriod._id] } : {});
    }
  }, [periods, activePeriod, initDefaults]);

  const handleOpenCreateModal = () => {
    setSelectedConcept(null);
    setFormModalOpen(true);
  }

  const handleEdit = (concept: ConceptDto) => {
    setSelectedConcept(concept);
    setFormModalOpen(true);
  };

  const handleDelete = (concept: ConceptDto) => {
    setConceptToDelete(concept);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setDeleteModalOpen(false);
    setConceptToDelete(null);
    setFormModalOpen(false);
    setSelectedConcept(null);
    setIsFormDirty(false);
  };

  const handleConfirmDelete = () => {
    if (!conceptToDelete) return;

    const promise = deleteMutation.mutateAsync(conceptToDelete._id);
    toast.promise(promise, {
      loading: "Eliminando concepto...",
      success: <b>Concepto eliminado con éxito</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
    handleCloseModals();
  };

  const handleFormChange = useCallback((formData: ConceptFormData, isDirty: boolean) => {
    setConceptFormData(formData);
    setIsFormDirty(isDirty);
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!conceptFormData || !conceptFormData.subjectId || !conceptFormData.periodId ||
      !conceptFormData.valuationType || !conceptFormData.description) {
      toast.error("Por favor, completa todos los campos del formulario.");
      return;
    }

    const payload: NewConcept = {
      subjectId: conceptFormData.subjectId,
      periodId: conceptFormData.periodId,
      valuationType: conceptFormData.valuationType,
      description: conceptFormData.description,
    };

    let promise;
    if (selectedConcept) {
      const conceptToUpdate: UpdateConcept = { ...payload };
      promise = updateMutation.mutateAsync({ id: selectedConcept._id, data: conceptToUpdate });
      toast.promise(promise, {
        loading: "Actualizando concepto...",
        success: <b>¡Concepto actualizado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    } else {
      promise = createMutation.mutateAsync(payload);
      toast.promise(promise, {
        loading: "Creando concepto...",
        success: <b>¡Concepto creado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    }

    handleCloseModals();
  };

  const filteredConcepts = useMemo(() => {
    const term = normalizeText(search);
    return concepts.filter(concept => {
      const matchSearch = term === "" || normalizeText(concept.description).includes(term);
      const matchPeriod = selectedPeriods.length === 0 || selectedPeriods.includes(concept.period._id);
      const matchSubject = selectedSubjects.length === 0 || selectedSubjects.includes(concept.subject._id);
      const matchValuation = selectedValuationTypes.length === 0 || selectedValuationTypes.includes(concept.valuationType);
      return matchSearch && matchPeriod && matchSubject && matchValuation;
    });
  }, [concepts, search, selectedPeriods, selectedSubjects, selectedValuationTypes]);

  const conceptFilterGroups: FilterGroup[] = [
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
    {
      id: "valuation",
      label: "Valoración",
      options: VALUATION_TYPES.map((v) => ({ value: v, label: v })),
      selected: selectedValuationTypes,
      onToggle: table.toggle("valuation"),
    },
  ];

  const totalPages = Math.ceil(filteredConcepts.length / ITEMS_PER_PAGE);
  // La página guardada puede quedar fuera de rango si la lista se reduce (p. ej. tras eliminar).
  const currentPage = Math.max(1, Math.min(table.page, totalPages));
  const paginatedConcepts = filteredConcepts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedConcept;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  return (
    <>
      <div className="w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-purple-900">
            Gestión de Conceptos
          </h1>

          <button
            onClick={handleOpenCreateModal}
            aria-label="Crear nuevo concepto"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
          >
            <PlusIcon className="h-6 w-6" strokeWidth={2} />
            Crear
          </button>
        </div>

        <div className="mb-6 flex">
          <SearchFilterBar
            search={search}
            onSearchChange={table.setSearch}
            placeholder="Buscar concepto"
            groups={conceptFilterGroups}
          />
        </div>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        <ConceptsTable
          concepts={paginatedConcepts}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => table.setPage(Math.min(totalPages, currentPage + 1))}
          onPrevPage={() => table.setPage(Math.max(1, currentPage - 1))}
          isLoading={isLoading}
          canManage={(concept) => canManageOwned(concept.author._id)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        title="¿Deseas eliminar el concepto?"
        body={conceptToDelete?.description ?? ''}
        confirmColor="pink"
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        title={!isEditMode ? "Nuevo Concepto" : "Editar Concepto"}
        subtitle={!isEditMode ? "Completa los datos para registrar un nuevo concepto." : "Actualiza los datos del concepto."}
        submitText={!isEditMode ? "Crear Concepto" : "Actualizar"}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
      >
        <ConceptForm
          initialData={selectedConcept}
          onFormChange={handleFormChange}
          subjects={subjects}
          periods={periods}
        />
      </FormModal>
    </>
  );
}
