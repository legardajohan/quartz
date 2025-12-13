import React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
  Card,
  Typography,
  Radio,
} from "@material-tailwind/react";
import type { IValuationBySubjectDTO, ILearningValuationDTO } from "../types";

type ValuationChecklistProps = {
  subject: IValuationBySubjectDTO;
  initialSelections?: Record<string, string | null>;
  open?: boolean;
  onToggle?: () => void;
  onChange?: (learningId: string, qualitativeValuation: string | null) => void;
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

function Icon({ id, open }: { id: number; open: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`${id === open ? "rotate-180" : ""} h-5 w-5 transition-transform`}
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
}: ValuationChecklistProps) {
  const [selections, setSelections] = React.useState<Record<string, string | null>>(initialSelections || {});

  React.useEffect(() => setSelections(initialSelections || {}), [initialSelections]);

  const handleSelect = (id: string, val: string | null) => {
    const next = { ...selections, [id]: val };
    setSelections(next);
    onChange?.(id, val);
  };

  const learningVals: ILearningValuationDTO[] = subject?.learningValuations || [];

  return (
    <Accordion open={!!open} icon={<Icon id={1} open={open ? 1 : 0} />}>
      <AccordionHeader onClick={onToggle}>
        <div className="w-full flex items-center justify-between">
          <Typography variant="h6" color="blue-gray">
            {subject?.subjectName ?? ""}
          </Typography>
        </div>
      </AccordionHeader>
      <AccordionBody>
        <Card className="h-full w-full overflow-auto">
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-3">
                  <Typography variant="small" color="blue-gray" className="font-bold opacity-80">
                    Aprendizajes
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-3 text-center">
                  <Typography variant="small" color="blue-gray" className="font-bold opacity-80">
                    Logrado
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-3 text-center">
                  <Typography variant="small" color="blue-gray" className="font-bold opacity-80">
                    En proceso
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-3 text-center">
                  <Typography variant="small" color="blue-gray" className="font-bold opacity-80">
                    Con dificultad
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {learningVals.map((l, idx) => {
                const isLast = idx === learningVals.length - 1;
                const classes = isLast ? "p-3" : "p-3 border-b border-blue-gray-50";
                const selected = selections[l.learningId] ?? l.qualitativeValuation ?? null;

                return (
                  <tr key={l.learningId}>
                    <td className={classes}>
                      <Typography variant="small" color="blue-gray" className="font-normal">
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
      </AccordionBody>
    </Accordion>
  );
}
