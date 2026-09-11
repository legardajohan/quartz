import { useMemo, useState } from "react";
import { Select, Option, Typography } from "@material-tailwind/react";
import { ClipboardCheck, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { SpinnerIcon } from "@/components/icons/SpinnerIcon";
import { extractErrorMessage } from "@/api/apiClient";
import { useAuthStore } from "../../auth/useAuthStore";
import { useSchoolsQuery } from "../../users/queries/useSchoolsQuery";
import { useBulkReportDownload } from "../useBulkReportDownload";
import type { IConsolidatedReportFilters } from "../types";
import type { GradeLevel } from "@/types/domain";

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];
const ALL_SCHOOLS_LABEL = "Todas las sedes";

export default function ConsolidatedReportsPanel() {
  const { sessionData } = useAuthStore();
  const { data: schools = [] } = useSchoolsQuery();
  const { download, isDownloading } = useBulkReportDownload();

  const isDocente = sessionData?.user.role === "Docente";
  const isChecklistEnabled = sessionData?.enabledReports.includes("checklist") ?? false;
  const isLetterEnabled = sessionData?.enabledReports.includes("communicative-letter") ?? false;
  const multipleShifts = sessionData?.multipleShifts ?? false;

  const [schoolId, setSchoolId] = useState(isDocente ? sessionData?.user.schoolId ?? "" : "");
  const [grade, setGrade] = useState<GradeLevel | "">(GRADE_LEVELS.length === 1 ? GRADE_LEVELS[0] : "");
  const [shiftId, setShiftId] = useState("");
  const [periodId, setPeriodId] = useState("");

  const ownSchoolName = useMemo(
    () => schools.find((s) => s._id === sessionData?.user.schoolId)?.name ?? "",
    [schools, sessionData?.user.schoolId]
  );
  const selectedSchoolLabel = isDocente
    ? ownSchoolName
    : schools.find((s) => s._id === schoolId)?.name ?? ALL_SCHOOLS_LABEL;
  const selectedPeriodLabel = sessionData?.periods.find((p) => p._id === periodId)?.name ?? "";

  const isReady = !!grade && !!periodId;

  const handleDownload = async (reportKind: "checklist" | "communicative-letter") => {
    if (!grade || !periodId) return;

    const filters: IConsolidatedReportFilters = {
      grade,
      periodId,
      ...(schoolId && { schoolId }),
      ...(shiftId && { shiftId }),
    };

    try {
      const result = await download(reportKind, filters, {
        schoolLabel: selectedSchoolLabel,
        periodLabel: selectedPeriodLabel,
      });

      if (result.includedCount === 0) {
        toast.error("No hay estudiantes evaluados que coincidan con esos filtros.");
        return;
      }

      if (result.skipped.length > 0) {
        toast(`Se incluyeron ${result.includedCount} estudiantes; se omitieron ${result.skipped.length}.`, {
          icon: "⚠️",
        });
      } else {
        toast.success(`Consolidado descargado con ${result.includedCount} estudiantes.`);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "No se pudo generar el consolidado."));
    }
  };

  return (
    <div className="max-w-2xl">
      <Typography variant="small" color="gray" className="mb-6 font-normal">
        Define una cohorte por sede, grado, jornada y período, y descarga un solo PDF con los
        informes de todos los estudiantes evaluados que la componen.
      </Typography>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Select
          color="purple"
          label="Sede"
          value={isDocente ? sessionData?.user.schoolId ?? "" : schoolId}
          onChange={(val) => setSchoolId(val ?? "")}
          disabled={isDocente}
          key={isDocente ? "docente" : schools.length}
        >
          {isDocente ? (
            <Option value={sessionData?.user.schoolId ?? ""}>{ownSchoolName}</Option>
          ) : (
            [
              <Option key="all" value="">{ALL_SCHOOLS_LABEL}</Option>,
              ...schools.map((school) => (
                <Option key={school._id} value={school._id}>
                  {school.name}
                </Option>
              )),
            ]
          )}
        </Select>

        <Select color="purple" label="Grado" value={grade} onChange={(val) => setGrade((val as GradeLevel) ?? "")}>
          {GRADE_LEVELS.map((level) => (
            <Option key={level} value={level}>
              {level}
            </Option>
          ))}
        </Select>

        {multipleShifts && (
          <Select color="purple" label="Jornada" value={shiftId} onChange={(val) => setShiftId(val ?? "")}>
            <Option value="">Todas las jornadas</Option>
            {(sessionData?.shifts ?? []).map((shift) => (
              <Option key={shift._id} value={shift._id}>
                {shift.name}
              </Option>
            ))}
          </Select>
        )}

        <Select
          color="purple"
          label="Período"
          value={periodId}
          onChange={(val) => setPeriodId(val ?? "")}
          key={sessionData?.periods.length}
        >
          {(sessionData?.periods ?? []).map((period) => (
            <Option key={period._id} value={period._id}>
              {period.name}
            </Option>
          ))}
        </Select>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {isChecklistEnabled && (
          <button
            type="button"
            disabled={!isReady || isDownloading}
            onClick={() => handleDownload("checklist")}
            className="flex items-center gap-2 rounded-full border border-purple-600 bg-white px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
          >
            {isDownloading ? <SpinnerIcon color="#9333ea" /> : <ClipboardCheck className="h-4 w-4" />}
            {isDownloading ? "Generando…" : "Descargar Lista de Chequeo"}
          </button>
        )}
        {isLetterEnabled && (
          <button
            type="button"
            disabled={!isReady || isDownloading}
            onClick={() => handleDownload("communicative-letter")}
            className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-purple-600"
          >
            {isDownloading ? <SpinnerIcon /> : <Mail className="h-4 w-4" />}
            {isDownloading ? "Generando…" : "Descargar Carta Comunicativa"}
          </button>
        )}
      </div>
    </div>
  );
}
