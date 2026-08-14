import { useState, useEffect } from "react";
import { Typography, Checkbox } from "@material-tailwind/react";
import { DocumentCheckIcon, EnvelopeOpenIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useInstitutionStore } from "../useInstitutionStore";
import type { ReportKind } from "@/types/domain";

const REPORT_OPTIONS: { value: ReportKind; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "checklist",
    label: "Lista de chequeo",
    description: "PDF con la valoración por dimensión de cada estudiante.",
    icon: DocumentCheckIcon,
  },
  {
    value: "communicative-letter",
    label: "Carta comunicativa",
    description: "Informe narrativo para las familias, con edición de conceptos por dimensión.",
    icon: EnvelopeOpenIcon,
  },
];

export function ReportSettingsPanel() {
  const { institution, isLoading, isSubmitting, error, fetchInstitution, updateSettings } = useInstitutionStore();

  const [enabledReports, setEnabledReports] = useState<ReportKind[]>([]);

  useEffect(() => {
    fetchInstitution();
  }, [fetchInstitution]);

  useEffect(() => {
    if (institution) {
      setEnabledReports(institution.settings.enabledReports);
    }
  }, [institution]);

  const toggleReport = (value: ReportKind) => {
    setEnabledReports((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const isDirty = institution
    ? JSON.stringify([...institution.settings.enabledReports].sort()) !== JSON.stringify([...enabledReports].sort())
    : false;

  const isSubmitDisabled = isSubmitting || !isDirty || enabledReports.length === 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enabledReports.length === 0) {
      toast.error("Debes habilitar al menos un informe.");
      return;
    }

    const promise = updateSettings({ enabledReports });
    toast.promise(promise, {
      loading: "Guardando configuración...",
      success: <b>¡Configuración actualizada con éxito!</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
  };

  if (isLoading && !institution) {
    return (
      <div className="flex justify-center items-center h-40">
        <Typography variant="small" className="text-gray-500">Cargando configuración…</Typography>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-8">
      <div>
        <Typography variant="h6" color="blue-gray" className="font-bold">
          Informes
        </Typography>
        <Typography variant="small" className="text-gray-500">
          Qué informes ofrece tu institución a los docentes.
        </Typography>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <Typography variant="small" color="blue-gray" className="font-bold mb-3">
          Informes habilitados
        </Typography>
        <div className="space-y-2">
          {REPORT_OPTIONS.map(({ value, label, description, icon: Icon }) => {
            const checked = enabledReports.includes(value);
            return (
              <label
                key={value}
                htmlFor={`report-${value}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-150 ${
                  checked ? "border-purple-200 bg-purple-50/60" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${checked ? "text-purple-600" : "text-gray-400"}`} />
                <div className="flex-1">
                  <Typography variant="small" color="blue-gray" className="font-medium">
                    {label}
                  </Typography>
                  <Typography variant="small" className="text-gray-500 text-xs">
                    {description}
                  </Typography>
                </div>
                <Checkbox
                  id={`report-${value}`}
                  crossOrigin={undefined}
                  ripple={false}
                  color="purple"
                  checked={checked}
                  onChange={() => toggleReport(value)}
                  containerProps={{ className: "p-0 shrink-0" }}
                />
              </label>
            );
          })}
        </div>
        {enabledReports.length === 0 && (
          <Typography variant="small" className="mt-2 text-red-500 text-xs">
            Debes habilitar al menos un informe.
          </Typography>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-full transition-all duration-150 active:scale-[0.97]"
      >
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
