import { useEffect, useState, useCallback } from "react";
import { PlusIcon, BellAlertIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Typography, IconButton, Tooltip } from "@material-tailwind/react";
import toast from "react-hot-toast";

import { usePeriodStore } from "../usePeriodStore";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import { DataTable, Column, ITEMS_PER_PAGE } from "../../../components/common/DataTable";
import { PeriodForm, PeriodFormData } from "./PeriodForm";
import { PeriodDto, NewPeriod, UpdatePeriod } from "../types";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

export function PeriodsPanel() {
  const { periods, isLoading, isSubmitting, error, fetchPeriods, createPeriod, updatePeriod, deletePeriod } =
    usePeriodStore();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [periodFormData, setPeriodFormData] = useState<PeriodFormData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodDto | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<PeriodDto | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleOpenCreateModal = () => {
    setSelectedPeriod(null);
    setFormModalOpen(true);
  };

  const handleEdit = (period: PeriodDto) => {
    setSelectedPeriod(period);
    setFormModalOpen(true);
  };

  const handleDelete = (period: PeriodDto) => {
    setPeriodToDelete(period);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setDeleteModalOpen(false);
    setPeriodToDelete(null);
    setFormModalOpen(false);
    setSelectedPeriod(null);
    setIsFormDirty(false);
  };

  const handleConfirmDelete = () => {
    if (!periodToDelete) return;

    const promise = deletePeriod(periodToDelete._id);
    toast.promise(promise, {
      loading: "Eliminando periodo...",
      success: <b>Periodo eliminado con éxito</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
    handleCloseModals();
  };

  const handleFormChange = useCallback((formData: PeriodFormData, isDirty: boolean) => {
    setPeriodFormData(formData);
    setIsFormDirty(isDirty);
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!periodFormData || !periodFormData.name.trim() || !periodFormData.year || !periodFormData.startDate || !periodFormData.endDate) {
      toast.error("Por favor, completa todos los campos del formulario.");
      return;
    }

    const payload = {
      name: periodFormData.name.trim(),
      year: Number(periodFormData.year),
      startDate: periodFormData.startDate,
      endDate: periodFormData.endDate,
      closingAlertDate: periodFormData.closingAlertDate || null,
      isActive: periodFormData.isActive,
    };

    let promise;
    if (selectedPeriod) {
      promise = updatePeriod(selectedPeriod._id, payload as UpdatePeriod);
      toast.promise(promise, {
        loading: "Actualizando periodo...",
        success: <b>¡Periodo actualizado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    } else {
      promise = createPeriod(payload as NewPeriod);
      toast.promise(promise, {
        loading: "Creando periodo...",
        success: <b>¡Periodo creado con éxito!</b>,
        error: (err) => <b>{err.toString()}</b>,
      });
    }

    handleCloseModals();
  };

  const totalPages = Math.ceil(periods.length / ITEMS_PER_PAGE);
  const paginatedPeriods = periods.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedPeriod;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  const columns: Column<PeriodDto>[] = [
    {
      header: "Periodo",
      accessor: (item) => (
        <div className="flex items-center gap-2">
          {item.isActive && (
            <Tooltip content="Periodo activo" size="sm">
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-500" />
            </Tooltip>
          )}
          <Typography variant="small" color="blue-gray" className="font-medium">
            {item.name}
          </Typography>
        </div>
      ),
    },
    {
      header: "Año",
      accessor: (item) => (
        <Typography variant="small" className="font-normal">
          {item.year}
        </Typography>
      ),
    },
    {
      header: "Fechas",
      accessor: (item) => (
        <Typography variant="small" className="font-normal whitespace-nowrap">
          {formatDate(item.startDate)} — {formatDate(item.endDate)}
        </Typography>
      ),
    },
    {
      header: "Alerta de cierre",
      accessor: (item) => (
        item.closingAlertDate ? (
          <div className="inline-flex items-center gap-1 rounded-xl border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-normal text-amber-700">
            <BellAlertIcon className="h-3.5 w-3.5" />
            {formatDate(item.closingAlertDate)}
          </div>
        ) : (
          <Typography variant="small" className="text-gray-400 font-normal">
            Sin definir
          </Typography>
        )
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
              Periodos académicos
            </Typography>
            <Typography variant="small" className="text-gray-500">
              Define cuántos periodos maneja tu institución y sus fechas.
            </Typography>
          </div>

          <button
            onClick={handleOpenCreateModal}
            aria-label="Crear nuevo periodo"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
          >
            <PlusIcon className="h-6 w-6" strokeWidth={2} />
            Crear
          </button>
        </div>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        <DataTable
          data={paginatedPeriods}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
          isLoading={isLoading}
          emptyMessage="No se encontraron periodos."
        />
      </div>

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        title="¿Deseas eliminar el periodo?"
        body={periodToDelete?.name ?? ''}
        confirmColor="pink"
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        title={!isEditMode ? "Nuevo Periodo" : "Editar Periodo"}
        subtitle={!isEditMode ? "Completa los datos para registrar un nuevo periodo académico." : "Actualiza los datos del periodo."}
        submitText={!isEditMode ? "Crear Periodo" : "Actualizar"}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
      >
        <PeriodForm
          initialData={selectedPeriod}
          onFormChange={handleFormChange}
        />
      </FormModal>
    </>
  );
}
