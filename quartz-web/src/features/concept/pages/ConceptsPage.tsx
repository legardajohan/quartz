import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useConceptStore } from "../useConceptStore";
import { useAuthStore } from "../../auth/useAuthStore";
import { useSubjectAxisLabel } from "../../subject/useSubjectAxisLabel";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import SearchFilterBar, { type FilterGroup } from "../../../components/common/SearchFilterBar";
import { ConceptDto, NewConcept, UpdateConcept, QualitativeValuation } from "../types";
import { ConceptForm, ConceptFormData } from "../components/ConceptForm";
import { ConceptsTable } from "../components/ConceptsTable";
import { ITEMS_PER_PAGE } from "../../../components/common/DataTable";
import { normalizeText } from "../../../utils/normalizeText";

const VALUATION_TYPES: QualitativeValuation[] = ["Logrado", "En proceso", "Con dificultad"];

export default function ConceptsPage() {
  const { concepts, isLoading, isSubmitting, error, createConcept, updateConcept, deleteConcept } =
    useConceptStore();
  const { sessionData } = useAuthStore();

  const subjects = sessionData?.subjects ?? [];
  const periods = sessionData?.periods ?? [];
  const currentUser = sessionData?.user;
  const axis = useSubjectAxisLabel();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [conceptFormData, setConceptFormData] = useState<ConceptFormData | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<ConceptDto | null>(null);
  const [conceptToDelete, setConceptToDelete] = useState<ConceptDto | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedValuationTypes, setSelectedValuationTypes] = useState<QualitativeValuation[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const hasInitializedFilter = useRef(false);

  useEffect(() => {
    useConceptStore.getState().fetchConcepts();
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

  const canManage = useCallback((concept: ConceptDto): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'Jefe de Área' || concept.author._id === currentUser._id;
  }, [currentUser]);

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

    const promise = deleteConcept(conceptToDelete._id);
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
      promise = updateConcept(selectedConcept._id, conceptToUpdate);
      toast.promise(promise, {
        loading: "Actualizando concepto...",
        success: <b>¡Concepto actualizado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    } else {
      promise = createConcept(payload);
      toast.promise(promise, {
        loading: "Creando concepto...",
        success: <b>¡Concepto creado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    }

    handleCloseModals();
  };

  const togglePeriodFilter = (periodId: string) => {
    setSelectedPeriods(prev =>
      prev.includes(periodId) ? prev.filter(id => id !== periodId) : [...prev, periodId]
    );
    setCurrentPage(1);
  };

  const toggleSubjectFilter = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
    setCurrentPage(1);
  };

  const toggleValuationTypeFilter = (valuationType: QualitativeValuation) => {
    setSelectedValuationTypes(prev =>
      prev.includes(valuationType) ? prev.filter(v => v !== valuationType) : [...prev, valuationType]
    );
    setCurrentPage(1);
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
      onToggle: togglePeriodFilter,
    },
    {
      id: "subject",
      label: axis.plural,
      options: subjects.map((subject) => ({ value: subject._id, label: subject.name })),
      selected: selectedSubjects,
      onToggle: toggleSubjectFilter,
    },
    {
      id: "valuation",
      label: "Valoración",
      options: VALUATION_TYPES.map((v) => ({ value: v, label: v })),
      selected: selectedValuationTypes,
      onToggle: (value) => toggleValuationTypeFilter(value as QualitativeValuation),
    },
  ];

  const totalPages = Math.ceil(filteredConcepts.length / ITEMS_PER_PAGE);
  const paginatedConcepts = filteredConcepts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedConcept;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  return (
    <>
      <div className="w-full relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-purple-900">
              Gestión de Conceptos
            </h1>

            <SearchFilterBar
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              placeholder="Buscar concepto"
              groups={conceptFilterGroups}
            />
          </div>

          <button
            onClick={handleOpenCreateModal}
            aria-label="Crear nuevo concepto"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
          >
            <PlusIcon className="h-6 w-6" strokeWidth={2} />
            Crear
          </button>
        </div>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        <ConceptsTable
          concepts={paginatedConcepts}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          onPrevPage={() => setCurrentPage(p => Math.max(1, p - 1))}
          isLoading={isLoading}
          canManage={canManage}
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
