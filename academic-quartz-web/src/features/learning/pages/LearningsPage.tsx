import { useEffect, useState } from "react";
import LearningCard from "../components/LearningCard";
import { useLearningStore } from "../useLearningStore";
import { SpinnerIcon } from "../../../components/icons";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import toast from "react-hot-toast";
import { Learning } from "../types";

export default function LearningsPage() {
  const {
    learnings,
    isLoading,
    error,
    fetchLearnings,
    deleteLearning
  } = useLearningStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [learningToDelete, setLearningToDelete] = useState<Learning | null>(null);

  useEffect(() => {
    fetchLearnings();
  }, [fetchLearnings]);

  const handleEdit = (id: string) => {
    console.log("Editing learning with id:", id);
    // Future implementation: open an edit modal or navigate to an edit page
  };

  const handleDelete = (id: string) => {
    console.log("Deleting learning with id:", id);
    const learning = learnings.find(l => l._id === id);
    if (learning) {
      setLearningToDelete(learning);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLearningToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!learningToDelete) return;

    handleCloseModal();
    const promise = deleteLearning(learningToDelete._id);

    toast.promise(promise, {
      loading: 'Eliminando aprendizaje...',
      success: <b>Aprendizaje eliminado con éxito</b>,
      error: (err) => <b>{err.toString()}</b>
    });
  };

  const renderContent = () => {
    if (isLoading) {
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
      return <p className="mt-4 text-gray-500">No se encontraron aprendizajes.</p>;
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
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold text-purple-900">
          Gestión de Aprendizajes Esperados
        </h1>
        {renderContent()}
      </div>

      <ConfirmationModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="¿Deseas eliminar el aprendizaje?"
        body={learningToDelete?.description ?? ''}
        confirmColor="pink"
      />
    </>
  );
}