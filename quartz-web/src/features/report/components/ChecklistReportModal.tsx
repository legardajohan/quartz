import { useEffect } from "react";
import { Dialog, DialogHeader, DialogBody, IconButton, Button, Typography } from "@material-tailwind/react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import ChecklistReportDocument from "./ChecklistReportDocument";
import { Loading } from "../../../components/ui/Loading";
import { useReportStore } from "../useReportStore";
import { usePdfShieldImage } from "../usePdfShieldImage";

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
  const { currentReport, isReportLoading, reportError, fetchChecklistReport, clearReport } = useReportStore();
  const shield = usePdfShieldImage(valuationId ?? undefined, !!currentReport?.institution.shield, "checklist");

  const isPdfReady = !!currentReport && !isReportLoading && !reportError && !shield.isLoading;

  useEffect(() => {
    if (open && valuationId) {
      fetchChecklistReport(valuationId);
    }
    if (!open) {
      clearReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valuationId]);

  const fileName = `lista-chequeo-${studentName.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return (
    <Dialog open={open} handler={onClose} size="xl" className="p-1">
      <DialogHeader className="flex items-center justify-between text-purple-900">
        <Typography variant="h6" color="purple">
          Lista de Chequeo · {studentName}
        </Typography>
        <div className="flex items-center gap-2">
          {isPdfReady && currentReport && (
            <PDFDownloadLink
              document={
                <ChecklistReportDocument report={currentReport} shieldSrc={shield.src} />
              }
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
        {!isPdfReady && !reportError && (
          <div className="flex h-full items-center justify-center">
            <Loading message="Generando vista previa…" />
          </div>
        )}
        {reportError && !isReportLoading && (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <Typography color="red" className="font-normal">
              {reportError}
            </Typography>
          </div>
        )}
        {isPdfReady && currentReport && (
          <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: "none" }}>
            <ChecklistReportDocument report={currentReport} shieldSrc={shield.src} />
          </PDFViewer>
        )}
      </DialogBody>
    </Dialog>
  );
}
