import { Document } from "@react-pdf/renderer";
import CommunicativeLetterPages from "./CommunicativeLetterPages";
import type { ICommunicativeLetterTemplate } from "../types";

interface CommunicativeLetterBulkDocumentProps {
  reports: ICommunicativeLetterTemplate[];
  shieldSrc?: string | null;
}

export default function CommunicativeLetterBulkDocument({ reports, shieldSrc }: CommunicativeLetterBulkDocumentProps) {
  return (
    <Document title={`Carta Comunicativa · ${reports.length} estudiantes`}>
      {reports.map((report) => (
        <CommunicativeLetterPages key={report._id} report={report} shieldSrc={shieldSrc} />
      ))}
    </Document>
  );
}
