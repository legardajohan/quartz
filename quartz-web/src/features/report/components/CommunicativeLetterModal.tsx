import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Dialog, DialogHeader, DialogBody, DialogFooter, IconButton, Button, Typography } from "@material-tailwind/react";
import { XMarkIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import CommunicativeLetterDocument from "./CommunicativeLetterDocument";
import LetterConceptPicker from "./LetterConceptPicker";
import { Loading } from "../../../components/ui/Loading";
import { useReportStore } from "../useReportStore";
import type { ConceptAssignmentUpdate } from "../types";

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
  const { currentLetter, isLetterLoading, letterError, fetchCommunicativeLetter, saveLetterConcepts, clearLetter } = useReportStore();
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && valuationId) {
      fetchCommunicativeLetter(valuationId);
    }
    if (!open) {
      clearLetter();
      setSelection({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valuationId]);

  useEffect(() => {
    if (!currentLetter) return;
    const serverSelection: Record<string, string> = {};
    currentLetter.subjects.forEach((subject) => {
      if (subject.evaluationMode === "checklist" && subject.assignedConceptId) {
        serverSelection[subject.subjectId] = subject.assignedConceptId;
      }
    });
    setSelection(serverSelection);
  }, [currentLetter]);

  const deferredSelection = useDeferredValue(selection);

  const isDirty = useMemo(() => {
    if (!currentLetter) return false;
    return currentLetter.subjects.some((subject) => {
      if (subject.evaluationMode !== "checklist") return false;
      return (selection[subject.subjectId] ?? "") !== (subject.assignedConceptId ?? "");
    });
  }, [currentLetter, selection]);

  const previewLetter = useMemo(() => {
    if (!currentLetter) return null;
    return {
      ...currentLetter,
      subjects: currentLetter.subjects.map((subject) => {
        if (subject.evaluationMode !== "checklist") return subject;
        const conceptId = deferredSelection[subject.subjectId] ?? subject.assignedConceptId;
        const concept = subject.availableConcepts.find((c) => c._id === conceptId);
        return {
          ...subject,
          assignedConceptId: conceptId ?? null,
          conceptText: concept?.description ?? subject.conceptText,
        };
      }),
    };
  }, [currentLetter, deferredSelection]);

  const isPdfReady = !!previewLetter && !isLetterLoading && !letterError;
  const isCoverageError = !!letterError && letterError.toLowerCase().includes("faltan conceptos");

  const handleSelect = (subjectId: string, conceptId: string) => {
    setSelection((prev) => ({ ...prev, [subjectId]: conceptId }));
  };

  const handleSave = async () => {
    if (!valuationId || !currentLetter) return;

    const assignments: ConceptAssignmentUpdate[] = currentLetter.subjects
      .filter((subject) => subject.evaluationMode === "checklist")
      .map((subject) => ({
        subjectId: subject.subjectId,
        conceptId: selection[subject.subjectId] ?? subject.assignedConceptId ?? "",
      }))
      .filter((assignment) => assignment.conceptId);

    setIsSaving(true);
    try {
      await saveLetterConcepts(valuationId, assignments);
      toast.success("Conceptos guardados");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al guardar: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const fileName = `carta-comunicativa-${studentName.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return (
    <Dialog open={open} handler={onClose} size="xl" className="p-1">
      <DialogHeader className="flex items-center justify-between text-purple-900">
        <Typography variant="h6" color="purple">
          Carta Comunicativa · {studentName}
        </Typography>
        <div className="flex items-center gap-2">
          {isPdfReady && previewLetter && (
            <PDFDownloadLink
              document={<CommunicativeLetterDocument report={previewLetter} />}
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

      <DialogBody className="h-[75vh] p-0">
        {isLetterLoading && (
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

        {isPdfReady && previewLetter && (
          <div className="flex h-full">
            <div className="w-[340px] shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/60 p-4">
              <LetterConceptPicker
                subjects={previewLetter.subjects}
                selection={selection}
                onSelect={handleSelect}
                disabled={isSaving}
              />
            </div>
            <div className="flex-1">
              <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: "none" }}>
                <CommunicativeLetterDocument report={previewLetter} />
              </PDFViewer>
            </div>
          </div>
        )}
      </DialogBody>

      {isPdfReady && (
        <DialogFooter className="justify-end border-t border-gray-100 py-3">
          <Button
            size="sm"
            color="purple"
            variant={isDirty ? "filled" : "outlined"}
            disabled={!isDirty || isSaving}
            onClick={handleSave}
            className="transition-transform active:scale-[0.97]"
          >
            {isSaving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
}
