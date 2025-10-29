import { useEffect } from "react";
import LearningCard from "../components/LearningCard";
import { useLearningStore } from "../useLearningStore";
import { SpinnerIcon } from "../../../components/icons";

export default function LearningsPage() {
  const { 
    learnings, 
    isLoading, 
    error, 
    fetchLearnings 
  } = useLearningStore();

  useEffect(() => {
    fetchLearnings();
  }, [fetchLearnings]);

  const handleEdit = (id: string) => {
    console.log("Editing learning with id:", id);
    // Future implementation: open an edit modal or navigate to an edit page
  };

  const handleDelete = (id: string) => {
    console.log("Deleting learning with id:", id);
    // Future implementation: show a confirmation dialog and call a delete action
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
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-blue-gray-800">
        Gestión de Aprendizajes Esperados
      </h1>
      <p className="mt-2 text-gray-600">
        Aquí puedes crear, visualizar, editar y eliminar los aprendizajes esperados para cada período.
      </p>
      {renderContent()}
    </div>
  );
}