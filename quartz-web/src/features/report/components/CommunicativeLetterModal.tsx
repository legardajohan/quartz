import { useEffect } from "react";
import { Dialog, DialogHeader, DialogBody, IconButton, Button, Typography } from "@material-tailwind/react";
import { XMarkIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import CommunicativeLetterDocument from "./CommunicativeLetterDocument";
import { Loading } from "../../../components/ui/Loading";
import { useReportStore } from "../useReportStore";
import { usePdfShieldImage } from "../usePdfShieldImage";

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
  const { currentLetter, isLetterLoading, letterError, fetchCommunicativeLetter, clearLetter } = useReportStore();
  const shield = usePdfShieldImage(valuationId ?? undefined, !!currentLetter?.institution.shield, "communicative-letter");

  const isPdfReady = !!currentLetter && !isLetterLoading && !letterError && !shield.isLoading;
  const isCoverageError = !!letterError && letterError.toLowerCase().includes("faltan conceptos");

  useEffect(() => {
    if (open && valuationId) {
      fetchCommunicativeLetter(valuationId);
    }
    if (!open) {
      clearLetter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valuationId]);

  const fileName = `carta-comunicativa-${studentName.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return (
    <Dialog open={open} handler={onClose} size="xl" className="p-1">
      <DialogHeader className="flex items-center justify-between text-purple-900">
        <Typography variant="h6" color="purple">
          Carta Comunicativa · {studentName}
        </Typography>
        <div className="flex items-center gap-2">
          {isPdfReady && currentLetter && (
            <PDFDownloadLink
              document={<CommunicativeLetterDocument report={currentLetter} shieldSrc={shield.src} />}
              fileName={fileName}
            >
              {({ loading }) => (
                <Button size="sm" color="purple" className="flex items-center gap-2" disabled={loading}>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  {loading ? "Preparando…" : "Descargar PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
          <IconButton variant="text" size="sm" onClick={onClose} className="text-blue-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </DialogHeader>

      <DialogBody className="h-[80vh] p-0">
        {!isPdfReady && !letterError && (
          <div className="flex h-full items-center justify-center">
            <Loading message="Componiendo la carta…" />
          </div>
        )}

        {letterError && !isLetterLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-10 text-center">
            <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
            <Typography variant="h6" color="blue-gray">
              {isCoverageError ? "Faltan conceptos por dimensión" : "No se pudo generar la carta"}
            </Typography>
            <Typography color="gray" className="max-w-md text-sm font-normal">
              {letterError}
            </Typography>
            {isCoverageError && (
              <Typography color="gray" className="text-xs font-normal">
                Carga los conceptos que faltan desde{" "}
                <span className="font-semibold text-purple-700">Académico · Conceptos</span>.
              </Typography>
            )}
          </div>
        )}

        {isPdfReady && currentLetter && (
          <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: "none" }}>
            <CommunicativeLetterDocument report={currentLetter} shieldSrc={shield.src} />
          </PDFViewer>
        )}
      </DialogBody>
    </Dialog>
  );
}
