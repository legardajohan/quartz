import { useState, useRef } from 'react';
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Learning } from "../types";
import { IconButton, Tooltip } from "@material-tailwind/react";

interface LearningCardProps {
  learning: Learning;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const LearningCard = ({ learning, onEdit, onDelete }: LearningCardProps) => {
  const HOVER_DELAY_MS = 1000;

  const [openEditTooltip, setOpenEditTooltip] = useState(false);
  const editTimerRef = useRef<number | null>(null);

  const handleEditMouseEnter = () => {
    if (editTimerRef.current === null) {
      editTimerRef.current = setTimeout(() => {
        setOpenEditTooltip(true);
        editTimerRef.current = null;
      }, HOVER_DELAY_MS);
    }
  };

  const handleEditMouseLeave = () => {
    if (editTimerRef.current !== null) {
      clearTimeout(editTimerRef.current);
      editTimerRef.current = null;
    }
    setOpenEditTooltip(false);
  };

  const [openDeleteTooltip, setOpenDeleteTooltip] = useState(false);
  const deleteTimerRef = useRef<number | null>(null);

  const handleDeleteMouseEnter = () => {
    if (deleteTimerRef.current === null) {
      deleteTimerRef.current = setTimeout(() => {
        setOpenDeleteTooltip(true);
        deleteTimerRef.current = null;
      }, HOVER_DELAY_MS);
    }
  };

  const handleDeleteMouseLeave = () => {
    if (deleteTimerRef.current !== null) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setOpenDeleteTooltip(false);
  };

  return (
    <div className="group bg-white rounded-md shadow hover:shadow-lg transition-shadow duration-200 p-5 px-6 mr-12 relative min-h-[50px] flex items-center">
      <div className="absolute top-0 right-6 -translate-y-1/2 bg-pink-500 rounded-md text-white font-semibold text-xs px-1 py-1 min-w-[70px] h-[18px] flex items-center justify-center">
        {learning.period.name}
      </div>

      <div className="flex items-center justify-between w-full">
        <p className="text-gray-700 font-normal text-lg leading-tight line-clamp-2 flex-grow mr-6">
          {learning.description}
        </p>

        <div className="flex-shrink-0 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Tooltip 
            content="Editar aprendizaje" 
            className="py-1 px-2 text-xs max-w-xs bg-gray-800" 
            open={openEditTooltip} 
          >
            <div 
              onMouseEnter={handleEditMouseEnter} 
              onMouseLeave={handleEditMouseLeave}
              className="inline-block"
            >
                <IconButton 
                  variant="text" 
                  className="text-gray-400 hover:text-purple-400 transition-colors duration-200" 
                  onClick={() => onEdit(learning._id)}
                >
                  <PencilIcon className="h-5 w-5"/>
                </IconButton>
            </div>
          </Tooltip>
          <Tooltip 
            content="Eliminar aprendizaje" 
            className="py-1 px-2 text-xs max-w-xs bg-gray-800"
            open={openDeleteTooltip}
          >
            <div
              onMouseEnter={handleDeleteMouseEnter}
              onMouseLeave={handleDeleteMouseLeave}
              className="inline-block"
            >
              <IconButton 
                variant="text" 
                className="text-gray-400 hover:text-pink-400 transition-colors duration-200" 
                onClick={() => onDelete(learning._id)}
              >
                <TrashIcon className="h-5 w-5"/>
              </IconButton>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default LearningCard;