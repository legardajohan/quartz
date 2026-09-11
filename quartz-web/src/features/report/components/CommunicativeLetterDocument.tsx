import { Document } from "@react-pdf/renderer";
import CommunicativeLetterPages from "./CommunicativeLetterPages";
import type { ICommunicativeLetterTemplate } from "../types";

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

interface CommunicativeLetterDocumentProps {
  report: ICommunicativeLetterTemplate;
  shieldSrc?: string | null;
}

export default function CommunicativeLetterDocument({ report, shieldSrc }: CommunicativeLetterDocumentProps) {
  return (
    <Document title={`Carta Comunicativa - ${formatFullName(report.student)}`}>
      <CommunicativeLetterPages report={report} shieldSrc={shieldSrc} />
    </Document>
  );
}
