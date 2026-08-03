import { useEffect, useState, useCallback } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Typography, IconButton, Tooltip } from "@material-tailwind/react";
import toast from "react-hot-toast";

import { useSubjectStore } from "../useSubjectStore";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import { DataTable, Column, ITEMS_PER_PAGE } from "../../../components/common/DataTable";
import { SubjectForm, SubjectFormData } from "./SubjectForm";
import { SubjectDto, NewSubject, UpdateSubject } from "../types";

export function SubjectsPanel() {
  const { subjects, isLoading, isSubmitting, error, fetchSubjects, createSubject, updateSubject, deleteSubject } =
    useSubjectStore();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState<SubjectFormData | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDto | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectDto | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenCreateModal = () => {
    setSelectedSubject(null);
    setFormModalOpen(true);
  };

  const handleEdit = (subject: SubjectDto) => {
    setSelectedSubject(subject);
    setFormModalOpen(true);
  };

  const handleDelete = (subject: SubjectDto) => {
    setSubjectToDelete(subject);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setDeleteModalOpen(false);
    setSubjectToDelete(null);
    setFormModalOpen(false);
    setSelectedSubject(null);
    setIsFormDirty(false);
  };

  const handleConfirmDelete = () => {
    if (!subjectToDelete) return;

    const promise = deleteSubject(subjectToDelete._id);
    toast.promise(promise, {
      loading: "Eliminando...",
      success: <b>{subjectToDelete.type} eliminada con éxito</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
    handleCloseModals();
  };

  const handleFormChange = useCallback((formData: SubjectFormData, isDirty: boolean) => {
    setSubjectFormData(formData);
    setIsFormDirty(isDirty);
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subjectFormData || !subjectFormData.name.trim() || !subjectFormData.type) {
      toast.error("Por favor, completa todos los campos del formulario.");
      return;
    }

    let promise;
    if (selectedSubject) {
      const subjectToUpdate: UpdateSubject = {
        name: subjectFormData.name.trim(),
        type: subjectFormData.type,
        evaluationMode: subjectFormData.evaluationMode,
      };
      promise = updateSubject(selectedSubject._id, subjectToUpdate);
      toast.promise(promise, {
        loading: "Actualizando...",
        success: <b>¡{subjectToUpdate.type} actualizada con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    } else {
      const subjectToCreate: NewSubject = {
        name: subjectFormData.name.trim(),
        type: subjectFormData.type,
        evaluationMode: subjectFormData.evaluationMode,
      };
      promise = createSubject(subjectToCreate);
      toast.promise(promise, {
        loading: "Creando...",
        success: <b>¡{subjectToCreate.type} creada con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    }

    handleCloseModals();
  };

  const totalPages = Math.ceil(subjects.length / ITEMS_PER_PAGE);
  const paginatedSubjects = subjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedSubject;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  const columns: Column<SubjectDto>[] = [
    {
      header: "Nombre",
      accessor: (item) => (
        <Typography variant="small" color="blue-gray" className="font-medium">
          {item.name}
        </Typography>
      ),
    },
    {
      header: "Tipo",
      accessor: (item) => (
        <div className="border border-gray-200 bg-white rounded-xl font-normal text-xs px-2 py-1 inline-flex items-center justify-center">
          {item.type}
        </div>
      ),
    },
    {
      header: "Modo de evaluación",
      accessor: (item) => (
        <div
          className={`rounded-xl font-normal text-xs px-2 py-1 inline-flex items-center justify-center ${
            item.evaluationMode === "description"
              ? "bg-purple-50 text-purple-700 border border-purple-100"
              : "bg-blue-50 text-blue-700 border border-blue-100"
          }`}
        >
          {item.evaluationMode === "description" ? "Descripción" : "Lista de chequeo"}
        </div>
      ),
    },
    {
      header: "Acciones",
      accessor: (item) => (
        <div className="flex items-center gap-2 min-w-[50px]">
          <Tooltip content="Editar" size="sm">
            <IconButton
              size="sm"
              color="white"
              className="text-gray-600 shadow-none hover:shadow-md hover:text-green-500 transition-all border border-gray-200"
              onClick={() => handleEdit(item)}
            >
              <PencilIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Eliminar" size="sm">
            <IconButton
              size="sm"
              color="white"
              className="text-gray-600 shadow-none hover:shadow-md hover:text-pink-500 transition-all border border-gray-200"
              onClick={() => handleDelete(item)}
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="w-full relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Typography variant="h6" color="blue-gray" className="font-bold">
              Ejes de Valoración
            </Typography>
            <Typography variant="small" className="text-gray-500">
              Gestiona los Ejes de Valoración de tu institución.
            </Typography>
          </div>

          <button
            onClick={handleOpenCreateModal}
            aria-label="Crear nueva dimensión"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
          >
            <PlusIcon className="h-6 w-6" strokeWidth={2} />
            Crear
          </button>
        </div>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        <DataTable
          data={paginatedSubjects}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
          isLoading={isLoading}
          emptyMessage="No se encontraron Ejes de Valoración."
        />
      </div>

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        title="¿Deseas eliminar este registro?"
        body={subjectToDelete ? `${subjectToDelete.name} (${subjectToDelete.type})` : ''}
        confirmColor="pink"
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        scrollable={false}
        title={selectedSubject ? `Editar ${selectedSubject.type}` : "Nuevo registro"}
        subtitle={!isEditMode ? "Completa los datos para registrarlo." : "Actualiza los datos."}
        submitText={!isEditMode ? "Crear" : "Actualizar"}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
      >
        <SubjectForm
          initialData={selectedSubject}
          onFormChange={handleFormChange}
        />
      </FormModal>
    </>
  );
}
