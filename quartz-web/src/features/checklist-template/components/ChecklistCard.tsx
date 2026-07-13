import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";
import { IconButton, Tooltip } from "@material-tailwind/react";
import type { ChecklistTemplateDto } from "../types";

export type ChecklistCardProps = {
  template: ChecklistTemplateDto;
  canManage: boolean;
  onEdit: (template: ChecklistTemplateDto) => void;
  onDelete: (template: ChecklistTemplateDto) => void;
};

export default function ChecklistCard({ template, canManage, onEdit, onDelete }: ChecklistCardProps) {
  const authorName = `${template.author.firstName} ${template.author.lastName}`;

  return (
    <div className="group bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-purple-900 leading-snug flex-grow">
          {template.name}
        </h3>
        {canManage && (
          <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Tooltip content="Editar plantilla" className="py-1 px-2 text-xs bg-gray-800">
              <IconButton
                variant="text"
                ripple={false}
                className="text-gray-400 hover:text-green-500 active:scale-95 focus-visible:outline-none transition-[color,transform] duration-150"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onEdit(template);
                }}
              >
                <PencilIcon className="h-4 w-4" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Eliminar plantilla" className="py-1 px-2 text-xs bg-gray-800">
              <IconButton
                variant="text"
                ripple={false}
                className="text-gray-400 hover:text-pink-500 active:scale-95 focus-visible:outline-none transition-[color,transform] duration-150"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onDelete(template);
                }}
              >
                <TrashIcon className="h-4 w-4" />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-blue-200 bg-blue-50/40 px-2 py-0.5 font-medium text-blue-600">
          {template.period.name}
        </span>
        <span className="bg-purple-100 text-purple-800 font-medium px-2 py-0.5 rounded-full">
          {template.grade}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <UserIcon className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-700">{authorName}</span>
      </div>
    </div>
  );
}
