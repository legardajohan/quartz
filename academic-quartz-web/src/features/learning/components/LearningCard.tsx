import {
  Card,
  CardBody,
  Typography,
  Chip,
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Learning } from "../types";

interface LearningCardProps {
  learning: Learning;
  // Add function props if needed, e.g., onEdit, onDelete
}

const LearningCard = ({ learning }: LearningCardProps) => {
  return (
    <Card className="mt-6 w-full bg-gray-900 text-white relative group shadow-lg border border-gray-800">
      <CardBody>
        {/* Icon Container - Visible on hover */}
        <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <PencilIcon className="h-5 w-5 text-gray-200 hover:text-purple-600 cursor-pointer" />
          <TrashIcon className="h-5 w-5 text-gray-200 hover:text-pink-500 cursor-pointer" />
        </div>

        {/* Tittle and Subject */}
        <Typography variant="h5" color="white" className="mb-1 font-nico">
          Titulo
        </Typography>
        <Typography className="text-purple-300 font-bold mb-4">
          {learning.subject.name}
        </Typography>

        {/* Description */}
        <Typography className="mb-6 text-gray-300">
          {learning.description}
        </Typography>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center gap-4">
            <Chip
              value={`${learning.period.name} 2025`}
              className="bg-pink-500 text-sm font-bold text-white"
            />
            <Typography className="text-sm text-gray-300">
              Prof: Johan Legarda 
            </Typography>
          </div>
          <Typography className="font-bold text-gray-300">
            Transición
          </Typography>
        </div>
      </CardBody>
    </Card>
  );
};

export default LearningCard;
