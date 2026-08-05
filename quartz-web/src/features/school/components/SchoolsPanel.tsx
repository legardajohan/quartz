import { useEffect, useState, useCallback } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Typography, IconButton, Tooltip } from "@material-tailwind/react";
import toast from "react-hot-toast";

import { useSchoolStore } from "../useSchoolStore";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import { DataTable, Column, ITEMS_PER_PAGE } from "../../../components/common/DataTable";
import { SchoolForm, SchoolFormData } from "./SchoolForm";
import { SchoolDto, NewSchool, UpdateSchool } from "../types";
import { extractErrorMessage } from "../../../api/apiClient";

export function SchoolsPanel() {
  const { schools, isLoading, isSubmitting, error, fetchSchools, createSchool, updateSchool, deleteSchool } =
    useSchoolStore();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [schoolFormData, setSchoolFormData] = useState<SchoolFormData | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolDto | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolDto | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleOpenCreateModal = () => {
    setSelectedSchool(null);
    setFormModalOpen(true);
  };

  const handleEdit = (school: SchoolDto) => {
    setSelectedSchool(school);
    setFormModalOpen(true);
  };

  const handleDelete = (school: SchoolDto) => {
    setSchoolToDelete(school);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setDeleteModalOpen(false);
    setSchoolToDelete(null);
    setFormModalOpen(false);
    setSelectedSchool(null);
    setIsFormDirty(false);
  };

  const handleConfirmDelete = () => {
    if (!schoolToDelete) return;

    const promise = deleteSchool(schoolToDelete._id);
    toast.promise(promise, {
      loading: "Eliminando...",
      success: <b>Sede eliminada con éxito</b>,
      error: (err) => <b>{extractErrorMessage(err, "No se pudo eliminar la sede.")}</b>,
    });
    handleCloseModals();
  };

  const handleFormChange = useCallback((formData: SchoolFormData, isDirty: boolean) => {
    setSchoolFormData(formData);
    setIsFormDirty(isDirty);
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!schoolFormData || !schoolFormData.name.trim()) {
      toast.error("Por favor, completa el nombre de la sede.");
      return;
    }

    let promise;
    if (selectedSchool) {
      const schoolToUpdate: UpdateSchool = { name: schoolFormData.name.trim() };
      promise = updateSchool(selectedSchool._id, schoolToUpdate);
      toast.promise(promise, {
        loading: "Actualizando...",
        success: <b>¡Sede actualizada con éxito!</b>,
        error: (err) => <b>{extractErrorMessage(err, "No se pudo actualizar la sede.")}</b>,
      });
    } else {
      const schoolToCreate: NewSchool = { name: schoolFormData.name.trim() };
      promise = createSchool(schoolToCreate);
      toast.promise(promise, {
        loading: "Creando...",
        success: <b>¡Sede creada con éxito!</b>,
        error: (err) => <b>{extractErrorMessage(err, "No se pudo crear la sede.")}</b>,
      });
    }

    handleCloseModals();
  };

  const totalPages = Math.ceil(schools.length / ITEMS_PER_PAGE);
  const paginatedSchools = schools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedSchool;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  const columns: Column<SchoolDto>[] = [
    {
      header: "Sede",
      accessor: (item) => (
        <div className="border border-gray-200 bg-white rounded-xl font-normal text-xs px-2 py-1 inline-flex items-center justify-center">
          Sede {item.schoolNumber}
        </div>
      ),
    },
    {
      header: "Nombre",
      accessor: (item) => (
        <Typography variant="small" color="blue-gray" className="font-medium">
          {item.name}
        </Typography>
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
              Sedes
            </Typography>
            <Typography variant="small" className="text-gray-500">
              Gestiona las sedes de tu institución.
            </Typography>
          </div>

          <button
            onClick={handleOpenCreateModal}
            aria-label="Crear nueva sede"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
          >
            <PlusIcon className="h-6 w-6" strokeWidth={2} />
            Crear
          </button>
        </div>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        <DataTable
          data={paginatedSchools}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
          isLoading={isLoading}
          emptyMessage="No se encontraron sedes."
        />
      </div>

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        title="¿Deseas eliminar esta sede?"
        body={schoolToDelete ? `Sede ${schoolToDelete.schoolNumber} — ${schoolToDelete.name}` : ''}
        confirmColor="pink"
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        scrollable={false}
        title={selectedSchool ? `Editar sede ${selectedSchool.schoolNumber}` : "Nueva sede"}
        subtitle={!isEditMode ? "Completa el nombre para registrarla." : "Actualiza el nombre."}
        submitText={!isEditMode ? "Crear" : "Actualizar"}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
      >
        <SchoolForm
          initialData={selectedSchool}
          onFormChange={handleFormChange}
        />
      </FormModal>
    </>
  );
}
