import { useEffect, useState } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import LearningCard from "../components/LearningCard";
import { LearningForm } from "../components/LearningForm";
import { useLearningStore } from "../useLearningStore";
import { SpinnerIcon } from "../../../components/icons";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import { Learning, NewLearning } from "../types";

export default function LearningsPage() {
  const {
    learnings,
    isLoading,
    isSubmitting,
    error,
    fetchLearnings,
    createLearning,
    deleteLearning
  } = useLearningStore();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [learningToDelete, setLearningToDelete] = useState<Learning | null>(null);
  const [newLearningData, setNewLearningData] = useState<Omit<NewLearning, 'grade'> | null>(null);

  useEffect(() => {
    fetchLearnings();
  }, [fetchLearnings]);

  const handleEdit = (id: string) => {
    console.log("Editing learning with id:", id);
  };

  const handleDelete = (id: string) => {
    const learning = learnings.find(l => l._id === id);
    if (learning) {
      setLearningToDelete(learning);
      setDeleteModalOpen(true);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setLearningToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!learningToDelete) return;

    const promise = deleteLearning(learningToDelete._id);
    toast.promise(promise, {
      loading: 'Eliminando aprendizaje...',
      success: <b>Aprendizaje eliminado con éxito</b>,
      error: (err) => <b>{err.toString()}</b>
    });
    handleCloseDeleteModal();
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newLearningData || !newLearningData.subjectId || !newLearningData.periodId || !newLearningData.description) {
      toast.error("Por favor, completa todos los campos del formulario.");
      return;
    }

    const learningToCreate: NewLearning = {
      ...newLearningData,
      grade: "Transición", // As per requirement
    };

    const promise = createLearning(learningToCreate);
    toast.promise(promise, {
      loading: 'Creando aprendizaje...',
      success: <b>Aprendizaje creado con éxito</b>,
      error: (err) => <b>{err.toString()}</b>
    });

    setFormModalOpen(false);
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
            onClick={() => setFormModalOpen(true)}
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
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="¿Deseas eliminar el aprendizaje?"
        body={learningToDelete?.description ?? ''}
        confirmColor="pink"
      />

      <FormModal
        open={isFormModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        title="Nuevo Aprendizaje"
        subtitle="Completa los datos para registrar un nuevo aprendizaje esperado."
        submitText="Crear Aprendizaje"
        isSubmitting={isSubmitting}
      >
        <LearningForm onFormChange={setNewLearningData} />
      </FormModal>
    </>
  );
}