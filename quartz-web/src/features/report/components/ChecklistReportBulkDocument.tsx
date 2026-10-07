import { Document } from "@react-pdf/renderer";
import ChecklistReportPages from "./ChecklistReportPages";
import type { IReportTemplate } from "../types";

interface ChecklistReportBulkDocumentProps {
  reports: IReportTemplate[];
  shieldSrc?: string | null;
}

export default function ChecklistReportBulkDocument({ reports, shieldSrc }: ChecklistReportBulkDocumentProps) {
  return (
    <Document title={`Lista de Chequeo · ${reports.length} estudiantes`}>
      {reports.map((report) => (
        <ChecklistReportPages key={report._id} report={report} shieldSrc={shieldSrc} />
      ))}
    </Document>
  );
}
