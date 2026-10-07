import { Document } from "@react-pdf/renderer";
import ChecklistReportPages from "./ChecklistReportPages";
import type { IReportTemplate } from "../types";

interface PersonName {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
}

function formatFullName(person: PersonName): string {
  return [person.firstName, person.middleName, person.lastName, person.secondLastName]
    .filter(Boolean)
    .join(" ");
}

interface ChecklistReportDocumentProps {
  report: IReportTemplate;
  shieldSrc?: string | null;
}

export default function ChecklistReportDocument({ report, shieldSrc }: ChecklistReportDocumentProps) {
  return (
    <Document title={`Lista de Chequeo - ${formatFullName(report.student)}`}>
      <ChecklistReportPages report={report} shieldSrc={shieldSrc} />
    </Document>
  );
}
