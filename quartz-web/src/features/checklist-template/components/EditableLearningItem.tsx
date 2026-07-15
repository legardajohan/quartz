import { useRef, useEffect, useLayoutEffect } from "react";
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

  const resize = (ta: HTMLTextAreaElement) => {
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  // Sincroniza la altura con el contenido en lectura y edición (mismo elemento
  // en ambos estados) → cada ítem conserva su espacio y no empuja a los demás.
  useLayoutEffect(() => {
    if (textareaRef.current) resize(textareaRef.current);
  }, [description]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    resize(e.target);
  };

  return (
    <div
      className={`group/item flex items-start gap-3 px-3 py-2.5 transition-colors duration-150 ${
        isEditing ? "bg-purple-50/40" : "hover:bg-gray-50"
      }`}
    >
      <div className="relative min-w-0 flex-grow">
        <textarea
          ref={textareaRef}
          value={description}
          onChange={handleChange}
          onClick={isEditing ? undefined : onActivate}
          onFocus={isEditing ? undefined : onActivate}
          readOnly={!isEditing}
          rows={1}
          placeholder="Escribe un aprendizaje…"
          className="w-full cursor-text resize-none overflow-hidden border-0 bg-transparent px-0 py-0.5 text-sm leading-snug text-gray-700 placeholder:italic placeholder:text-gray-300 focus:outline-none"
        />
        {/* Baseline gris sutil, visible al hover en reposo */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gray-200 opacity-0 transition-opacity duration-150 group-hover/item:opacity-100 motion-reduce:transition-none" />
        {/* Subrayado morado que crece desde el centro al editar */}
        <span
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-center bg-purple-500 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
            isEditing ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mt-0.5 flex-shrink-0 text-transparent transition-colors group-hover/item:text-gray-300 hover:text-pink-500"
          aria-label="Eliminar ítem"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
