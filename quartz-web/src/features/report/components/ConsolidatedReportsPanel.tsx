import { useMemo, useState } from "react";
import { Select, Option, Radio, Typography } from "@material-tailwind/react";
import { ClipboardCheck, Mail, Download } from "lucide-react";
import toast from "react-hot-toast";
import { SpinnerIcon } from "@/components/icons/SpinnerIcon";
import { extractErrorMessage } from "@/api/apiClient";
import { useAuthStore } from "../../auth/useAuthStore";
import { useSchoolsQuery } from "../../users/queries/useSchoolsQuery";
import { useBulkReportDownload } from "../useBulkReportDownload";
import type { IConsolidatedReportFilters } from "../types";
import { REPORT_KIND_LABELS, type GradeLevel, type ReportKind } from "@/types/domain";

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];
const ALL_SCHOOLS_LABEL = "Todas las sedes";

const REPORT_OPTIONS: { value: ReportKind; description: string; icon: React.ElementType }[] = [
  {
    value: "checklist",
    description: "Un PDF con la valoración por dimensión de cada estudiante de la cohorte.",
    icon: ClipboardCheck,
  },
  {
    value: "communicative-letter",
    description: "Un PDF con el informe narrativo para las familias de cada estudiante.",
    icon: Mail,
  },
];

export default function ConsolidatedReportsPanel() {
  const { sessionData } = useAuthStore();
  const { data: schools = [] } = useSchoolsQuery();
  const { download, isDownloading } = useBulkReportDownload();

  const isDocente = sessionData?.user.role === "Docente";
  const multipleShifts = sessionData?.multipleShifts ?? false;

  const [schoolId, setSchoolId] = useState(isDocente ? sessionData?.user.schoolId ?? "" : "");
  const [grade, setGrade] = useState<GradeLevel | "">(GRADE_LEVELS.length === 1 ? GRADE_LEVELS[0] : "");
  const [shiftId, setShiftId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [pickedKind, setPickedKind] = useState<ReportKind | null>(null);

  const reportOptions = useMemo(
    () => REPORT_OPTIONS.filter((option) => sessionData?.enabledReports.includes(option.value)),
    [sessionData?.enabledReports]
  );

  // Derivado en vez de guardado en estado: `enabledReports` llega con la sesión, así que la
  // primera opción disponible queda preseleccionada sin un `useEffect` de sincronización.
  const reportKind =
    pickedKind && reportOptions.some((option) => option.value === pickedKind)
      ? pickedKind
      : reportOptions[0]?.value ?? null;

  const ownSchoolName = useMemo(
    () => schools.find((s) => s._id === sessionData?.user.schoolId)?.name ?? "",
    [schools, sessionData?.user.schoolId]
  );
  const selectedSchoolLabel = isDocente
    ? ownSchoolName
    : schools.find((s) => s._id === schoolId)?.name ?? ALL_SCHOOLS_LABEL;
  const selectedPeriodLabel = sessionData?.periods.find((p) => p._id === periodId)?.name ?? "";

  const isReady = !!grade && !!periodId && !!reportKind;

  const handleDownload = async () => {
    if (!grade || !periodId || !reportKind) return;

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
        toast.success(
          `${REPORT_KIND_LABELS[reportKind]} descargada con ${result.includedCount} estudiantes.`
        );
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "No se pudo generar el consolidado."));
    }
  };

  return (
    <div className="max-w-2xl">
      <Typography variant="small" color="gray" className="mb-6 font-normal">
        Define una cohorte por sede, grado, jornada y período, elige qué informe necesitas y
        descarga un solo PDF con los estudiantes evaluados que la componen.
      </Typography>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Select
          color="purple"
          label="Sede"
          value={isDocente ? sessionData?.user.schoolId ?? "" : schoolId}
          onChange={(val) => setSchoolId(val ?? "")}
          disabled={isDocente}
          menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
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

        <Select
          color="purple"
          label="Grado"
          value={grade}
          onChange={(val) => setGrade((val as GradeLevel) ?? "")}
          menuProps={{ placement: "bottom" }}
        >
          {GRADE_LEVELS.map((level) => (
            <Option key={level} value={level}>
              {level}
            </Option>
          ))}
        </Select>

        {multipleShifts && (
          <Select
            color="purple"
            label="Jornada"
            value={shiftId}
            onChange={(val) => setShiftId(val ?? "")}
            menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
          >
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
          menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
          key={sessionData?.periods.length}
        >
          {(sessionData?.periods ?? []).map((period) => (
            <Option key={period._id} value={period._id}>
              {period.name}
            </Option>
          ))}
        </Select>
      </div>

      <div className="mt-8">
        <Typography
          variant="small"
          color="blue-gray"
          className="mb-3 font-bold"
          id="consolidated-report-kind"
        >
          Tipo de informe
        </Typography>
        <div className="space-y-2" role="radiogroup" aria-labelledby="consolidated-report-kind">
          {reportOptions.map(({ value, description, icon: Icon }) => {
            const checked = reportKind === value;
            return (
              <label
                key={value}
                htmlFor={`consolidated-${value}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition duration-150 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                  checked ? "border-purple-200 bg-purple-50/60" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`mt-0.5 h-5 w-5 shrink-0 transition-colors duration-150 ${
                    checked ? "text-purple-600" : "text-gray-400"
                  }`}
                />
                <div className="flex-1">
                  <Typography variant="small" color="blue-gray" className="font-medium">
                    {REPORT_KIND_LABELS[value]}
                  </Typography>
                  <Typography variant="small" className="text-xs text-gray-500">
                    {description}
                  </Typography>
                </div>
                <Radio
                  id={`consolidated-${value}`}
                  name="consolidated-report-kind"
                  crossOrigin={undefined}
                  ripple={false}
                  color="purple"
                  checked={checked}
                  onChange={() => setPickedKind(value)}
                  containerProps={{ className: "p-0 shrink-0" }}
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={!isReady || isDownloading}
          onClick={handleDownload}
          className="flex min-w-[11rem] items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition duration-150 hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-purple-600 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {isDownloading ? <SpinnerIcon /> : <Download className="h-4 w-4" />}
          {isDownloading ? "Generando…" : "Descargar"}
        </button>
        {!isReady && (
          <Typography variant="small" className="text-xs font-normal text-gray-500">
            Elige grado y período para habilitar la descarga.
          </Typography>
        )}
      </div>
    </div>
  );
}
