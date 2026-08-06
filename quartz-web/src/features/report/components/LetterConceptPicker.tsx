import { Typography, Radio } from "@material-tailwind/react";
import type { ILetterSubjectBlock } from "../types";
import type { QualitativeValuation } from "../types";

const LEVEL_STYLES: Record<QualitativeValuation, { dot: string; text: string; radio: "green" | "amber" | "red" }> = {
  "Logrado": { dot: "bg-green-500", text: "text-green-700", radio: "green" },
  "En proceso": { dot: "bg-amber-500", text: "text-amber-700", radio: "amber" },
  "Con dificultad": { dot: "bg-red-500", text: "text-red-700", radio: "red" },
};

interface LetterConceptPickerProps {
  subjects: ILetterSubjectBlock[];
  selection: Record<string, string>;
  onSelect: (subjectId: string, conceptId: string) => void;
  disabled?: boolean;
}

export default function LetterConceptPicker({ subjects, selection, onSelect, disabled }: LetterConceptPickerProps) {
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

        return (
          <div key={subject.subjectId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Dimensión {subject.subjectName}
              </Typography>
              <span className={`flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-1 text-[11px] font-semibold ${levelStyle.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} />
                {level}
              </span>
            </div>
            <div className="mt-2 flex flex-col">
              {subject.availableConcepts.map((concept) => (
                <Radio
                  key={concept._id}
                  name={`concept-${subject.subjectId}`}
                  color={levelStyle.radio}
                  checked={selectedId === concept._id}
                  onChange={() => onSelect(subject.subjectId, concept._id)}
                  disabled={disabled}
                  crossOrigin="anonymous"
                  ripple={false}
                  label={
                    <Typography variant="small" className="text-gray-700">
                      {concept.description}
                    </Typography>
                  }
                  containerProps={{ className: "-mt-1" }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
