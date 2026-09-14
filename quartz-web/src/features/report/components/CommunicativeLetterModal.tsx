import { useEffect, useMemo } from "react";
import { Dialog, DialogHeader, DialogBody, IconButton, Button, Typography } from "@material-tailwind/react";
import { XMarkIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import CommunicativeLetterDocument from "./CommunicativeLetterDocument";
import { Loading } from "../../../components/ui/Loading";
import { useReportStore } from "../useReportStore";
import { useReportPdf } from "../useReportPdf";
import { useInstitutionShieldQuery } from "@/features/institution/queries/useInstitutionShieldQuery";

interface CommunicativeLetterModalProps {
  open: boolean;
  valuationId: string | null;
  studentName: string;
  onClose: () => void;
}

export default function CommunicativeLetterModal({
  open,
  valuationId,
  studentName,
  onClose,
}: CommunicativeLetterModalProps) {
  const currentLetter = useReportStore((state) => state.currentLetter);
  const isLetterLoading = useReportStore((state) => state.isLetterLoading);
  const letterError = useReportStore((state) => state.letterError);
  const fetchCommunicativeLetter = useReportStore((state) => state.fetchCommunicativeLetter);
  const clearLetter = useReportStore((state) => state.clearLetter);
  const shield = useInstitutionShieldQuery();

  useEffect(() => {
    if (open && valuationId) {
      fetchCommunicativeLetter(valuationId);
    }
    if (!open) {
      clearLetter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valuationId]);

  // Memoizado para que un re-render del modal no regenere el PDF: `useReportPdf` reacciona a la
  // identidad del elemento, no a su contenido.
  const pdfDocument = useMemo(
    () =>
      currentLetter && !isLetterLoading && !shield.isLoading ? (
        <CommunicativeLetterDocument report={currentLetter} shieldSrc={shield.src} />
      ) : null,
    [currentLetter, isLetterLoading, shield.isLoading, shield.src]
  );

  const pdf = useReportPdf(pdfDocument);

  const errorMessage = letterError ?? pdf.error;
  const isCoverageError = !!letterError && letterError.toLowerCase().includes("faltan conceptos");
  const fileName = `carta-comunicativa-${studentName.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return (
    <Dialog open={open} handler={onClose} size="xl" className="p-1">
      <DialogHeader className="flex items-center justify-between text-purple-900">
        <Typography variant="h6" color="purple">
          Carta Comunicativa · {studentName}
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
            <Loading message="Componiendo la carta…" />
          </div>
        )}

        {errorMessage && !isLetterLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-10 text-center">
            <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
            <Typography variant="h6" color="blue-gray">
              {isCoverageError ? "Faltan conceptos por dimensión" : "No se pudo generar la carta"}
            </Typography>
            <Typography color="gray" className="max-w-md text-sm font-normal">
              {errorMessage}
            </Typography>
            {isCoverageError && (
              <Typography color="gray" className="text-xs font-normal">
                Carga los conceptos que faltan desde{" "}
                <span className="font-semibold text-purple-700">Académico · Conceptos</span>.
              </Typography>
            )}
          </div>
        )}

        {pdf.isReady && pdf.url && (
          <iframe
            src={`${pdf.url}#toolbar=0`}
            title={`Carta Comunicativa · ${studentName}`}
            className="h-full w-full border-none"
          />
        )}
      </DialogBody>
    </Dialog>
  );
}
