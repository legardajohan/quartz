import { useEffect, useState, useCallback } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import LearningCard from "../components/LearningCard";
import { LearningForm } from "../components/LearningForm";
import { useLearningStore } from "../useLearningStore";
import { useAuthStore } from "../../auth/useAuthStore";
import { SpinnerIcon } from "../../../components/icons";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import { Learning, NewLearning, UpdateLearning } from "../types";

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
  

  useEffect(() => {
    useLearningStore.getState().fetchLearnings();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedLearning(null);
    setFormModalOpen(true);
  }

  const handleEdit = (id: string) => {
    const learning = learnings.find((l) => l._id === id);
    if (learning) {
      setSelectedLearning(learning);
      setFormModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    const learning = learnings.find((l) => l._id === id);
    if (learning) {
      setLearningToDelete(learning);
      setDeleteModalOpen(true);
    }
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
        error: (err) => <b>{ err.toString() }</b>,
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

  const renderContent = () => {
    if (isLoading && learnings.length === 0) {
      return (
        <div className="flex justify-center items-center mt-10">
          <SpinnerIcon className="h-12 w-12" />
        </div>
      );
    }

    if (error) {
      return <p className="mt-4 text-red-500">{error}</p>;
    }

    if (learnings.length === 0) {
      return <p className="mt-4 text-gray-500">No se encontraron aprendizajes. ¡Crea uno nuevo!</p>;
    }

    return (
      <div className="flex flex-col gap-6 mt-6">
        {learnings.map((learning) => (
          <LearningCard
            key={learning._id}
            learning={learning}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  const isEditMode = !!selectedLearning;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-sm relative">
        <h1 className="text-2xl font-semibold text-purple-900">
          Gestión de Aprendizajes Esperados
        </h1>

        {renderContent()}

        {/* Centered container for the add button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleOpenCreateModal}
            aria-label="Crear nuevo aprendizaje"
            className="group relative flex justify-center rounded-full focus:outline-none"
          >
            <PlusCircleIcon
              className="h-11 w-11 text-purple-500 transition-all duration-300 ease-in-out group-hover:text-purple-700 group-hover:drop-shadow-purple-700 group-hover:scale-110"
              strokeWidth={1}
            />
          </button>
        </div>
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