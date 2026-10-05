import { AlertTriangle, CheckCircle2, FileWarning } from "lucide-react";
import { Chip, Typography } from "@material-tailwind/react";
import type { ICurriculumHealth } from "../types";

interface CurriculumHealthPanelProps {
  data: ICurriculumHealth;
}

export function CurriculumHealthPanel({ data }: CurriculumHealthPanelProps) {
  const hasIssues = data.subjectsWithoutLearnings.length > 0 || data.missingConcepts.length > 0;

  if (!hasIssues) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
        <Typography variant="small" className="font-medium text-green-800">
          Sin bloqueos: todas las dimensiones tienen aprendizajes y conceptos completos para este período.
        </Typography>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {data.subjectsWithoutLearnings.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <Typography variant="small" className="font-semibold text-blue-gray-800">
              Dimensiones sin aprendizajes ({data.subjectsWithoutLearnings.length})
            </Typography>
          </div>
          <ul className="space-y-2">
            {data.subjectsWithoutLearnings.map((subject) => (
              <li key={subject.subjectId} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {subject.subjectName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.missingConcepts.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-amber-600" />
            <Typography variant="small" className="font-semibold text-blue-gray-800">
              Huecos de concepto ({data.missingConcepts.length})
            </Typography>
          </div>
          <ul className="space-y-2">
            {data.missingConcepts.map((row) => (
              <li key={row.subjectId} className="rounded-lg bg-amber-50 px-3 py-2">
                <Typography variant="small" className="font-medium text-amber-900">
                  {row.subjectName}
                </Typography>
                <div className="mt-1 flex flex-wrap gap-1">
                  {row.missing.map((level) => (
                    <Chip key={level} size="sm" value={level} variant="ghost" className="normal-case" />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
