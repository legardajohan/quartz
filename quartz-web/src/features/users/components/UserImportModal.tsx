import { useRef, useState } from "react";
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Typography } from "@material-tailwind/react";
import { ArrowDownTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { extractErrorMessage } from "@/api/apiClient";
import {
  downloadImportTemplate,
  usePreviewImportMutation,
  useConfirmImportMutation,
} from "../queries/useUserImportQuery";
import type { ImportKind, ImportPreview, ImportResult, ImportRowError } from "../types";

type ImportStep = "select" | "preview" | "result";

interface UserImportModalProps {
  open: boolean;
  kind: ImportKind;
  onClose: () => void;
}

const KIND_LABEL: Record<ImportKind, string> = { students: "Estudiantes", staff: "Equipo docente" };

const REQUIRED_COLUMNS: Record<ImportKind, string> = {
  students: "Primer nombre, Primer apellido, Tipo y Número de identificación y Sede",
  staff: "Rol, Primer nombre, Primer apellido, Tipo y Número de identificación, Correo y Sede",
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

export default function UserImportModal({ open, kind, onClose }: UserImportModalProps) {
  const [step, setStep] = useState<ImportStep>("select");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
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
    setResult(null);
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
      setResult(await confirmMutation.mutateAsync({ kind, rows: preview.valid }));
      setStep("result");
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
              obligatorias: {REQUIRED_COLUMNS[kind]}. Solo se crean las filas válidas; las demás se informan con su
              motivo.
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

        {step === "result" && result && (
          <>
            <p className="flex items-center gap-2 text-base font-semibold text-purple-900">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              {result.created} {result.created === 1 ? "usuario creado" : "usuarios creados"}
            </p>
            {result.skipped.length > 0 && (
              <>
                <p className="text-sm text-amber-800">
                  {result.skipped.length} {result.skipped.length === 1 ? "fila omitida" : "filas omitidas"}:
                </p>
                <SkippedRowsTable rows={result.skipped} />
              </>
            )}
            {result.invitationsFailed.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">No se pudo enviar la invitación a:</p>
                <ul className="mt-1 list-inside list-disc">
                  {result.invitationsFailed.map((f) => (
                    <li key={f.row}>
                      Fila {f.row} · {f.email}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">Los usuarios quedaron creados: usa "Reenviar invitación" en su fila de la tabla.</p>
              </div>
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
            <Button variant="gradient" color="purple" onClick={handleConfirm} disabled={validCount === 0 || isBusy}>
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
        {step === "result" && (
          <Button variant="gradient" color="purple" onClick={handleClose}>
            <span>Cerrar</span>
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
