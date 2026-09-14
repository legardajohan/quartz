import { useEffect, useMemo } from "react";
import { Dialog, DialogHeader, DialogBody, IconButton, Button, Typography } from "@material-tailwind/react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import ChecklistReportDocument from "./ChecklistReportDocument";
import { Loading } from "../../../components/ui/Loading";
import { useReportStore } from "../useReportStore";
import { useReportPdf } from "../useReportPdf";
import { useInstitutionShieldQuery } from "@/features/institution/queries/useInstitutionShieldQuery";

interface ChecklistReportModalProps {
  open: boolean;
  valuationId: string | null;
  studentName: string;
  onClose: () => void;
}

export default function ChecklistReportModal({
  open,
  valuationId,
  studentName,
  onClose,
}: ChecklistReportModalProps) {
  const currentReport = useReportStore((state) => state.currentReport);
  const isReportLoading = useReportStore((state) => state.isReportLoading);
  const reportError = useReportStore((state) => state.reportError);
  const fetchChecklistReport = useReportStore((state) => state.fetchChecklistReport);
  const clearReport = useReportStore((state) => state.clearReport);
  const shield = useInstitutionShieldQuery();

  useEffect(() => {
    if (open && valuationId) {
      fetchChecklistReport(valuationId);
    }
    if (!open) {
      clearReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valuationId]);

  // Memoizado para que un re-render del modal no regenere el PDF: `useReportPdf` reacciona a la
  // identidad del elemento, no a su contenido.
  const pdfDocument = useMemo(
    () =>
      currentReport && !isReportLoading && !shield.isLoading ? (
        <ChecklistReportDocument report={currentReport} shieldSrc={shield.src} />
      ) : null,
    [currentReport, isReportLoading, shield.isLoading, shield.src]
  );

  const pdf = useReportPdf(pdfDocument);

  const errorMessage = reportError ?? pdf.error;
  const fileName = `lista-chequeo-${studentName.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return (
    <Dialog open={open} handler={onClose} size="xl" className="p-1">
      <DialogHeader className="flex items-center justify-between text-purple-900">
        <Typography variant="h6" color="purple">
          Lista de Chequeo · {studentName}
        </Typography>
        <div className="flex items-center gap-2">
          {/* Misma estructura que producía `PDFDownloadLink`: un <a download> envolviendo el
              botón, pero apuntando al único blob que ya generó `useReportPdf`. */}
          {pdf.isReady && pdf.url && (
            <a href={pdf.url} download={fileName}>
              <Button size="sm" color="purple" className="flex items-center gap-2">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Descargar PDF
              </Button>
            </a>
          )}
          <IconButton variant="text" size="sm" onClick={onClose} className="text-blue-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </DialogHeader>
      <DialogBody className="h-[80vh] p-0">
        {!pdf.isReady && !errorMessage && (
          <div className="flex h-full items-center justify-center">
            <Loading message="Generando vista previa…" />
          </div>
        )}
        {errorMessage && !isReportLoading && (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <Typography color="red" className="font-normal">
              {errorMessage}
            </Typography>
          </div>
        )}
        {pdf.isReady && pdf.url && (
          <iframe
            src={`${pdf.url}#toolbar=0`}
            title={`Lista de Chequeo · ${studentName}`}
            className="h-full w-full border-none"
          />
        )}
      </DialogBody>
    </Dialog>
  );
}
