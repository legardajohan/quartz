import { useState } from "react";
import { Typography, Select, Option, Textarea, IconButton } from "@material-tailwind/react";
import { SquarePen, Check } from "lucide-react";
import { STATUS_ICON_SVG } from "../statusVisuals";
import type { ILetterSubjectBlock } from "../types";
import type { QualitativeValuation } from "../types";

const LEVEL_STYLES: Record<QualitativeValuation, { dot: string; text: string; select: "green" | "amber" | "red" }> = {
  "Logrado": { dot: "bg-green-500", text: "text-green-700", select: "green" },
  "En proceso": { dot: "bg-amber-500", text: "text-amber-700", select: "amber" },
  "Con dificultad": { dot: "bg-red-500", text: "text-red-700", select: "red" },
};

const MAX_CONCEPT_TEXT_LENGTH = 2000;

interface LetterConceptPickerProps {
  subjects: ILetterSubjectBlock[];
  selection: Record<string, string>;
  onSelect: (subjectId: string, conceptId: string) => void;
  conceptText: Record<string, string>;
  onTextChange: (subjectId: string, text: string) => void;
  disabled?: boolean;
}

export default function LetterConceptPicker({
  subjects,
  selection,
  onSelect,
  conceptText,
  onTextChange,
  disabled,
}: LetterConceptPickerProps) {
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {subjects.map((subject) => {
        if (subject.evaluationMode === "description") {
          return (
            <div key={subject.subjectId} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Dimensión {subject.subjectName}
              </Typography>
              <Typography variant="small" className="mt-2 leading-relaxed text-gray-600">
                {subject.conceptText || "Sin descripción registrada."}
              </Typography>
              <Typography variant="small" className="mt-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Tomado de la Lista de Chequeo
              </Typography>
            </div>
          );
        }

        const level = subject.valuationType ?? "Logrado";
        const levelStyle = LEVEL_STYLES[level];
        const selectedId = selection[subject.subjectId] ?? subject.assignedConceptId ?? "";
        const hasMultipleCandidates = subject.availableConcepts.length > 1;
        const isEditing = editingSubjectId === subject.subjectId;
        const text = conceptText[subject.subjectId] ?? subject.conceptText ?? "";

        return (
          <div key={subject.subjectId} className="grid grid-cols-[1fr_150px] gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Dimensión {subject.subjectName}
                </Typography>
                <IconButton
                  variant="text"
                  size="sm"
                  color="blue-gray"
                  disabled={disabled}
                  onClick={() => setEditingSubjectId(isEditing ? null : subject.subjectId)}
                  className="shrink-0"
                >
                  {isEditing ? <Check className="h-4 w-4" /> : <SquarePen className="h-4 w-4" />}
                </IconButton>
              </div>

              {hasMultipleCandidates && (
                <div className="mt-3">
                  <Select
                    key={`${subject.subjectId}|${subject.availableConcepts.length}|${selectedId}`}
                    label="Concepto asignado"
                    color={levelStyle.select}
                    value={selectedId}
                    disabled={disabled}
                    onChange={(value) => value && onSelect(subject.subjectId, value)}
                    selected={(_, index) =>
                      `Opción ${(index ?? 0) + 1} de ${subject.availableConcepts.length}`
                    }
                    menuProps={{ className: "max-h-72 overflow-y-auto" }}
                  >
                    {subject.availableConcepts.map((concept, index) => (
                      <Option key={concept._id} value={concept._id} className="flex-col items-start gap-1 py-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-blue-gray-400">
                          Opción {index + 1}
                        </span>
                        <span className="line-clamp-2 text-xs leading-relaxed text-blue-gray-700">
                          {concept.description}
                        </span>
                      </Option>
                    ))}
                  </Select>
                  <Typography variant="small" className="mt-1 text-[11px] text-gray-400">
                    {subject.availableConcepts.length} opciones para este periodo, dimensión y estado
                  </Typography>
                </div>
              )}

              <div className="mt-3">
                {isEditing ? (
                  <>
                    <Textarea
                      color="purple"
                      label="Edita el concepto"
                      value={text}
                      disabled={disabled}
                      rows={4}
                      onChange={(e) => onTextChange(subject.subjectId, e.target.value.slice(0, MAX_CONCEPT_TEXT_LENGTH))}
                    />
                    <Typography variant="small" className="mt-1 text-right text-[11px] text-gray-400">
                      {text.length}/{MAX_CONCEPT_TEXT_LENGTH}
                    </Typography>
                  </>
                ) : (
                  <Typography
                    key={text}
                    variant="small"
                    className="animate-fade-in leading-relaxed text-gray-600"
                  >
                    {text || "Sin descripción registrada."}
                  </Typography>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <img src={STATUS_ICON_SVG[level]} alt={level} className="h-20 w-20" />
              <span className={`flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-1 text-[11px] font-semibold ${levelStyle.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} />
                {level}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
