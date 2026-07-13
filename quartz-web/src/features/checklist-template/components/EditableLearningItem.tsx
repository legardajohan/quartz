import { useRef, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

export type EditableLearningItemProps = {
  description: string;
  isEditing: boolean;
  onActivate: () => void;
  onChange: (value: string) => void;
  onRemove?: () => void;
};

export default function EditableLearningItem({
  description,
  isEditing,
  onActivate,
  onChange,
  onRemove,
}: EditableLearningItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <div className="group/item flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
      <div className="flex-grow min-w-0">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={description}
            onChange={handleChange}
            rows={1}
            className="w-full resize-none bg-transparent border-0 border-b-2 border-purple-500 px-0 py-0.5 text-sm text-gray-700 focus:outline-none overflow-hidden leading-snug"
          />
        ) : (
          <p
            onClick={onActivate}
            className="text-sm text-gray-700 border-b border-transparent group-hover/item:border-purple-300 cursor-text py-0.5 transition-colors leading-snug min-h-[1.25rem]"
          >
            {description || <span className="text-gray-300 italic">Escribe un ítem…</span>}
          </p>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 text-transparent group-hover/item:text-gray-300 hover:text-pink-500 transition-colors"
          aria-label="Eliminar ítem"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
