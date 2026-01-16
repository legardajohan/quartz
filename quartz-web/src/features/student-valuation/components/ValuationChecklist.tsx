import React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
  Card,
  Typography,
  Radio,
} from "@material-tailwind/react";
import {
  LightBulbIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  FireIcon,
  PaintBrushIcon,
  ScaleIcon,
  BookOpenIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { IValuationBySubjectDTO, ILearningValuationDTO } from "../types";
import { ValuationState } from "../types/domain";
import { ValuationStatusBadge } from "./ValuationStatusBadge";

// Export icons for parent usage
export const SUBJECT_ICONS = [
  LightBulbIcon,
  HeartIcon,
  FireIcon,
  ChatBubbleLeftRightIcon,
  PaintBrushIcon,
  ScaleIcon,
  UsersIcon,
  BookOpenIcon,
];

type ValuationChecklistProps = {
  subject: IValuationBySubjectDTO;
  initialSelections?: Record<string, string | null>;
  open?: boolean;
  onToggle?: () => void;
  onChange?: (learningId: string, qualitativeValuation: string | null) => void;
  icon?: React.ElementType; // New prop for icon injection
};

function IconCheck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-full w-full scale-105"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowIcon({ id, open }: { id: number; open: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`${id === open ? "rotate-180" : ""} h-5 w-5 transition-transform text-gray-500`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function ValuationChecklist({
  subject,
  initialSelections = {},
  open = false,
  onToggle,
  onChange,
  icon: Icon = BookOpenIcon, // Default fallback
}: ValuationChecklistProps) {
  const [selections, setSelections] = React.useState<Record<string, string | null>>(initialSelections || {});

  React.useEffect(() => setSelections(initialSelections || {}), [initialSelections]);

  const handleSelect = (id: string, val: string | null) => {
    const next = { ...selections, [id]: val };
    setSelections(next);
    onChange?.(id, val);
  };

  const learningVals: ILearningValuationDTO[] = subject?.learningValuations || [];

  // Calculate subject status locally
  const totalLearnings = learningVals.length;
  const valuedLearnings = learningVals.filter(l => {
    const val = selections[l.learningId] ?? l.qualitativeValuation;
    return val !== null && val !== undefined;
  }).length;

  let subjectStatus: ValuationState = "NOT_STARTED";
  if (valuedLearnings === 0) {
    subjectStatus = "NOT_STARTED";
  } else if (valuedLearnings === totalLearnings) {
    subjectStatus = "COMPLETED";
  } else {
    subjectStatus = "IN_PROGRESS";
  }

  // Helper to get status label text
  const getStatusLabel = () => {
    if (subjectStatus === "COMPLETED") return "Completado";
    if (subjectStatus === "NOT_STARTED") return "Sin iniciar";
    return `En Progreso (${valuedLearnings}/${totalLearnings})`;
  };

  // Determine styling based on status
  const getStatusStyles = () => {
    switch (subjectStatus) {
      case "COMPLETED":
        return {
          iconColor: "text-green-500",
          iconBg: "bg-green-50",
          itemBorder: open ? "border-green-100" : "border-gray-200"
        };
      case "IN_PROGRESS":
        return {
          iconColor: "text-blue-500",
          iconBg: "bg-blue-50",
          itemBorder: open ? "border-blue-100" : "border-gray-200"
        };
      default:
        return {
          iconColor: "text-gray-500",
          iconBg: "bg-gray-100",
          itemBorder: "border-gray-200"
        };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <div className={`rounded-xl border ${statusStyles.itemBorder} bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300`}>
      <Accordion open={!!open} icon={<ArrowIcon id={1} open={open ? 1 : 0} />}>
        <AccordionHeader
          onClick={onToggle}
          className={`p-4 ${open ? 'border-b border-gray-100' : 'border-b-0'} hover:bg-gray-50/50 transition-colors rounded-xl`}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon Circle */}
              <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${statusStyles.iconBg}`}>
                <Icon className={`h-6 w-6 ${statusStyles.iconColor}`} />
              </div>

              {/* Text Info */}
              <div className="flex flex-col items-start gap-1">
                <Typography variant="h6" color="blue-gray" className="font-bold leading-tight">
                  Dimensión {subject?.subjectName ?? ""}
                </Typography>
                <ValuationStatusBadge
                  status={subjectStatus}
                  customLabel={getStatusLabel()}
                />
              </div>
            </div>
          </div>
        </AccordionHeader>

        <AccordionBody className="pt-4 pb-4 px-4">
          {learningVals.length > 0 ? (
            <Card className="h-full w-auto mx-4 overflow-hidden shadow-none rounded-lg border border-gray-100">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 bg-white p-2">
                      <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase opacity-90">
                        Aprendizajes
                      </Typography>
                    </th>
                    <th className="border-b border-gray-200 bg-white p-2 text-center w-24">
                      <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase opacity-90">
                        Logrado
                      </Typography>
                    </th>
                    <th className="border-b border-gray-200 bg-white p-2 text-center w-24">
                      <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase opacity-90">
                        En proceso
                      </Typography>
                    </th>
                    <th className="border-b border-gray-200 bg-white p-2 text-center w-24">
                      <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase opacity-90">
                        Con dificultad
                      </Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {learningVals.map((l, idx) => {
                    const isLast = idx === learningVals.length - 1;
                    const classes = isLast ? "p-2" : "p-2 border-b border-gray-100";
                    const selected = selections[l.learningId] ?? l.qualitativeValuation ?? null;

                    return (
                      <tr key={l.learningId} className="hover:bg-gray-50 transition-colors">
                        <td className={classes}>
                          <Typography variant="small" color="blue-gray" className="font-medium text-gray-700">
                            {l.learningDescription ?? ""}
                          </Typography>
                        </td>
                        <td className={`${classes} text-center`}>
                          <Radio
                            name={`valuation-${l.learningId}`}
                            color="green"
                            icon={<IconCheck />}
                            id={`${l.learningId}-Logrado`}
                            checked={selected === "Logrado"}
                            onChange={() => handleSelect(l.learningId, "Logrado")}
                            ripple={true}
                            crossOrigin="anonymous"
                          />
                        </td>
                        <td className={`${classes} text-center`}>
                          <Radio
                            name={`valuation-${l.learningId}`}
                            color="amber"
                            icon={<IconCheck />}
                            id={`${l.learningId}-EnProceso`}
                            checked={selected === "En proceso"}
                            onChange={() => handleSelect(l.learningId, "En proceso")}
                            ripple={true}
                            crossOrigin="anonymous"
                          />
                        </td>
                        <td className={`${classes} text-center`}>
                          <Radio
                            name={`valuation-${l.learningId}`}
                            color="red"
                            icon={<IconCheck />}
                            id={`${l.learningId}-ConDificultad`}
                            checked={selected === "Con dificultad"}
                            onChange={() => handleSelect(l.learningId, "Con dificultad")}
                            ripple={true}
                            crossOrigin="anonymous"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Typography variant="small" className="font-medium">
                No hay aprendizajes asociados a esta dimensión.
              </Typography>
            </div>
          )}
        </AccordionBody>
      </Accordion>
    </div>
  );
}