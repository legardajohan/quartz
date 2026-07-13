import { useState } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
  Tooltip,
} from "@material-tailwind/react";
import {
  LightBulbIcon,
  HeartIcon,
  FireIcon,
  ChatBubbleLeftRightIcon,
  PaintBrushIcon,
  ScaleIcon,
  UsersIcon,
  BookOpenIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import EditableLearningItem from "./EditableLearningItem";
import type { SubjectSnapshot, ChecklistTemplateDto } from "../types";

const SUBJECT_ICONS = [
  LightBulbIcon,
  HeartIcon,
  FireIcon,
  ChatBubbleLeftRightIcon,
  PaintBrushIcon,
  ScaleIcon,
  UsersIcon,
  BookOpenIcon,
];

export type ChecklistEditorProps = {
  initialTemplate: ChecklistTemplateDto;
  name: string;
  isSubmitting: boolean;
  onSave: (subjects: SubjectSnapshot[]) => void;
  onCancel: () => void;
};

type EditingKey = `${number}-${number}`;

function AccordionArrow({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function ChecklistEditor({
  initialTemplate,
  name,
  isSubmitting,
  onSave,
  onCancel,
}: ChecklistEditorProps) {
  const savedSubjectsJson = JSON.stringify(initialTemplate.subjects);

  const [subjects, setSubjects] = useState<SubjectSnapshot[]>(
    initialTemplate.subjects.map((s) => ({
      subject: s.subject,
      learnings: s.learnings.map((l) => ({ _id: l._id, description: l.description })),
    }))
  );
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [editingKey, setEditingKey] = useState<EditingKey | null>(null);

  const isDirty =
    name !== initialTemplate.name || JSON.stringify(subjects) !== savedSubjectsJson;

  const canSave = isDirty && !isSubmitting && !!name.trim();

  const toggleAccordion = (idx: number) =>
    setOpenIndex((prev) => (prev === idx ? null : idx));

  const updateDescription = (si: number, li: number, value: string) => {
    setSubjects((prev) =>
      prev.map((s, i) =>
        i !== si
          ? s
          : {
              ...s,
              learnings: s.learnings.map((l, j) =>
                j !== li ? l : { ...l, description: value }
              ),
            }
      )
    );
  };

  const addLearning = (si: number) => {
    const newLi = subjects[si].learnings.length;
    setSubjects((prev) =>
      prev.map((s, i) =>
        i !== si ? s : { ...s, learnings: [...s.learnings, { description: "" }] }
      )
    );
    setEditingKey(`${si}-${newLi}`);
    setOpenIndex(si);
  };

  const removeLearning = (si: number, li: number) => {
    setSubjects((prev) =>
      prev.map((s, i) =>
        i !== si ? s : { ...s, learnings: s.learnings.filter((_, j) => j !== li) }
      )
    );
    setEditingKey(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave(subjects);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Acordeones por dimensión */}
      <div className="flex flex-col gap-2">
        {subjects.map((s, si) => {
          const Icon = SUBJECT_ICONS[si % SUBJECT_ICONS.length];
          const isOpen = openIndex === si;

          return (
            <div
              key={s.subject._id}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
            >
              <Accordion open={isOpen} icon={<AccordionArrow open={isOpen} />}>
                <AccordionHeader
                  onClick={() => toggleAccordion(si)}
                  className="px-4 py-3 border-b-0 hover:bg-gray-50 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50">
                      <Icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {s.subject.name}
                    </span>
                  </div>
                </AccordionHeader>

                <AccordionBody className="px-4 pb-4 pt-0">
                  <div className="flex flex-col">
                    {s.learnings.map((l, li) => (
                      <EditableLearningItem
                        key={li}
                        description={l.description}
                        isEditing={editingKey === `${si}-${li}`}
                        onActivate={() => setEditingKey(`${si}-${li}`)}
                        onChange={(val) => updateDescription(si, li, val)}
                        onRemove={
                          s.learnings.length > 1
                            ? () => removeLearning(si, li)
                            : undefined
                        }
                      />
                    ))}
                  </div>

                  {/* Botón "+" centrado */}
                  <div className="flex justify-center pt-2 mt-1 border-t border-gray-100">
                    <Tooltip
                      content="Agregar aprendizaje"
                      className="py-1 px-2 text-xs bg-gray-800"
                    >
                      <button
                        type="button"
                        onClick={() => addLearning(si)}
                        className="text-gray-300 hover:text-purple-600 hover:bg-purple-50 transition-colors p-1.5 rounded-full"
                        aria-label="Agregar aprendizaje"
                      >
                        <PlusIcon className="h-5 w-5" strokeWidth={2} />
                      </button>
                    </Tooltip>
                  </div>
                </AccordionBody>
              </Accordion>
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-full transition-colors"
        >
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
