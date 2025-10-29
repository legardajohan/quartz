import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Learning } from "../types";

interface LearningCardProps {
  learning: Learning;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const LearningCard = ({ learning, onEdit, onDelete }: LearningCardProps) => {
  return (
    <div className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 p-5 px-6 mx-8 relative min-h-[80px] flex items-center">
      {/* Period Badge */}
      <div className="absolute top-0 right-6 -translate-y-1/2 bg-pink-500 rounded-md text-white font-semibold text-xs px-1 py-1 min-w-[70px] h-[25px] flex items-center justify-center">
        {learning.period.name}
      </div>

      {/* Wrapper for description and buttons */}
      <div className="flex items-center justify-between w-full">
        {/* Description Text */}
        <p className="text-gray-800 font-normal text-lg leading-tight line-clamp-2 flex-grow mr-6">
          {learning.description}
        </p>

        {/* Action Buttons - Visible on hover */}
        <div className="flex-shrink-0 flex gap-6 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onEdit(learning._id)}
            className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
            aria-label="Editar objetivo"
          >
            <PencilIcon className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onDelete(learning._id)}
            className="text-gray-400 hover:text-pink-400 transition-colors duration-200"
            aria-label="Eliminar objetivo"
          >
            <TrashIcon className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningCard;
