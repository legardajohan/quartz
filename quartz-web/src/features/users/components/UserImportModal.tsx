import { useRef, useState } from "react";
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Typography } from "@material-tailwind/react";
import { ArrowDownTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { extractErrorMessage } from "@/api/apiClient";
import { useOfferedLevels } from "@/features/institution/queries/useOfferedLevels";
import {
  downloadImportTemplate,
  usePreviewImportMutation,
  useConfirmImportMutation,
} from "../queries/useUserImportQuery";
import type { ImportKind, ImportPreview, ImportResult, ImportRowError } from "../types";

type ImportStep = "select" | "preview";

interface UserImportModalProps {
  open: boolean;
  kind: ImportKind;
  onClose: () => void;
  onCompleted: (result: ImportResult, kind: ImportKind) => void;
}

function Spinner() {
  return (
    <svg className="-ml-1 mr-2 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

const KIND_LABEL: Record<ImportKind, string> = { students: "Estudiantes", staff: "Equipo docente" };

const REQUIRED_COLUMNS: Record<ImportKind, string> = {
  students: "Primer nombre, Primer apellido, Tipo y Número de identificación y Sede",
  staff: "Rol, Primer nombre, Primer apellido, Tipo y Número de identificación, Correo y Sede",
};

// Solo con varios niveles ofertados la plantilla trae columna de nivel; con uno, se asigna solo.
const LEVEL_COLUMN_HINT: Record<ImportKind, string> = {
  students: "La columna Nivel es obligatoria.",
  staff: "En Niveles escribe uno o varios separados por coma; es obligatoria para Docente.",
};

function SkippedRowsTable({ rows }: { rows: ImportRowError[] }) {
  return (
    <div className="max-h-56 overflow-y-auto thin-scrollbar rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-purple-50 text-purple-900">
          <tr>
            <th className="w-20 px-3 py-2 font-semibold">Fila</th>
            <th className="px-3 py-2 font-semibold">Motivos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {rows.map((r) => (
            <tr key={r.row}>
              <td className="px-3 py-2 align-top tabular-nums">{r.row}</td>
              <td className="px-3 py-2">
                <ul className="space-y-0.5">
                  {r.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UserImportModal({ open, kind, onClose, onCompleted }: UserImportModalProps) {
  const { isSingle: isSingleLevel } = useOfferedLevels();
  const [step, setStep] = useState<ImportStep>("select");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = usePreviewImportMutation();
  const confirmMutation = useConfirmImportMutation();
  const isBusy = previewMutation.isPending || confirmMutation.isPending;

  const resetState = () => {
    setStep("select");
    setFile(null);
    setFileError(null);
    setPreview(null);
    previewMutation.reset();
    confirmMutation.reset();
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
    resetState();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await downloadImportTemplate(kind);
    } catch (err) {
      toast.error(extractErrorMessage(err, "No se pudo descargar la plantilla."));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setFileError(null);
    try {
      setPreview(await previewMutation.mutateAsync({ kind, file }));
      setStep("preview");
    } catch (err) {
      setFileError(extractErrorMessage(err, "No se pudo validar el archivo."));
    }
  };

  const handleConfirm = async () => {
    if (!preview || preview.valid.length === 0) return;
    try {
      const result = await confirmMutation.mutateAsync({ kind, rows: preview.valid });
      onClose();
      resetState();
      onCompleted(result, kind);
    } catch (err) {
      toast.error(extractErrorMessage(err, "No se pudieron crear los usuarios."));
    }
  };

  const handleBackToSelect = () => {
    setStep("select");
    setPreview(null);
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validCount = preview?.valid.length ?? 0;

  return (
    <Dialog open={open} handler={handleClose} size="md" className="px-5 py-3" dismiss={{ enabled: false }}>
      <DialogHeader>
        <Typography variant="h4" className="text-purple-900">
          Cargue masivo de {KIND_LABEL[kind]}
        </Typography>
      </DialogHeader>

      <DialogBody className="max-h-[70vh] space-y-4 overflow-y-auto thin-scrollbar pr-2">
        {step === "select" && (
          <>
            <p className="text-sm text-gray-700">
              Descarga la plantilla, diligénciala y súbela en formato <b>.xlsx</b> (máximo 1 MB). Columnas
              obligatorias: {REQUIRED_COLUMNS[kind]}.{!isSingleLevel && ` ${LEVEL_COLUMN_HINT[kind]}`} Solo se crean las
              filas válidas; las demás se informan con su motivo.
            </p>

            <Button
              variant="outlined"
              color="purple"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" strokeWidth={2} />
              <span>{isDownloading ? "Descargando..." : "Descargar plantilla"}</span>
            </Button>

            <div>
              <label htmlFor="import-file" className="mb-1 block text-sm font-medium text-purple-900">
                Archivo
              </label>
              <input
                id="import-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setFileError(null);
                }}
                className="block w-full cursor-pointer rounded-lg border border-gray-300 text-sm text-gray-700 file:mr-3 file:cursor-pointer file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:font-medium file:text-purple-900 hover:file:bg-purple-100"
              />
              {fileError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {fileError}
                </p>
              )}
            </div>
          </>
        )}

        {step === "preview" && preview && (
          <>
            <p className="flex items-center gap-2 text-base font-semibold text-purple-900">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              {validCount} {validCount === 1 ? "usuario listo" : "usuarios listos"} para crear
            </p>
            {preview.invalid.length > 0 && (
              <>
                <p className="flex items-center gap-2 text-sm text-amber-800">
                  <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                  {preview.invalid.length} {preview.invalid.length === 1 ? "fila se omitirá" : "filas se omitirán"}:
                </p>
                <SkippedRowsTable rows={preview.invalid} />
              </>
            )}
          </>
        )}
      </DialogBody>

      <DialogFooter>
        {step === "select" && (
          <>
            <Button variant="text" color="blue-gray" onClick={handleClose} className="mr-1" disabled={isBusy}>
              <span>Cancelar</span>
            </Button>
            <Button variant="gradient" color="purple" onClick={handleValidate} disabled={!file || isBusy}>
              <span>{previewMutation.isPending ? "Validando..." : "Validar archivo"}</span>
            </Button>
          </>
        )}
        {step === "preview" && (
          <>
            <Button variant="text" color="blue-gray" onClick={handleBackToSelect} className="mr-1" disabled={isBusy}>
              <span>Volver</span>
            </Button>
            <Button
              variant="gradient"
              color="purple"
              onClick={handleConfirm}
              disabled={validCount === 0 || isBusy}
              className="flex items-center justify-center"
            >
              {confirmMutation.isPending && <Spinner />}
              <span>
                {confirmMutation.isPending
                  ? kind === "staff"
                    ? "Creando y enviando invitaciones..."
                    : "Creando..."
                  : `Crear ${validCount} ${validCount === 1 ? "usuario" : "usuarios"}`}
              </span>
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
