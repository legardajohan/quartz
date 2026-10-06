import { useState, useEffect } from "react";
import { Typography, Checkbox } from "@material-tailwind/react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/api/apiClient";

import { useInstitutionQuery, useUpdateInstitutionSettingsMutation } from "../queries/useInstitutionQuery";
import { GRADE_LEVELS, GRADE_LEVEL_AGES, type GradeLevel } from "@/types/domain";

export function LevelsPanel() {
  const { data: institution, isPending: isLoading, error: queryError } = useInstitutionQuery();
  const updateMutation = useUpdateInstitutionSettingsMutation();
  const isSubmitting = updateMutation.isPending;
  const error = queryError ? extractErrorMessage(queryError, "Falló la carga de la configuración institucional.") : null;

  const [offeredLevels, setOfferedLevels] = useState<GradeLevel[]>([]);

  useEffect(() => {
    if (institution) {
      setOfferedLevels(institution.settings.offeredLevels);
    }
  }, [institution]);

  // Se reconstruye en orden canónico: el diff contra el servidor no depende del orden de clic.
  const toggleLevel = (value: GradeLevel) => {
    setOfferedLevels((prev) =>
      GRADE_LEVELS.filter((level) => (level === value ? !prev.includes(level) : prev.includes(level)))
    );
  };

  const isDirty = institution
    ? institution.settings.offeredLevels.join("|") !== offeredLevels.join("|")
    : false;

  const isSubmitDisabled = isSubmitting || !isDirty || offeredLevels.length === 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (offeredLevels.length === 0) {
      toast.error("Selecciona al menos un nivel.");
      return;
    }

    const promise = updateMutation.mutateAsync({ offeredLevels });
    toast.promise(promise, {
      loading: "Guardando niveles...",
      success: <b>¡Niveles actualizados con éxito!</b>,
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
          Niveles
        </Typography>
        <Typography variant="small" className="text-gray-500">
          Qué niveles de Preescolar ofrece tu institución. Solo estos aparecen al registrar estudiantes, aprendizajes y plantillas.
        </Typography>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <Typography variant="small" color="blue-gray" className="font-bold mb-3">
          Niveles ofertados
        </Typography>
        <div className="space-y-2">
          {GRADE_LEVELS.map((value) => {
            const checked = offeredLevels.includes(value);
            return (
              <label
                key={value}
                htmlFor={`level-${value}`}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors duration-150 ${
                  checked ? "border-purple-200 bg-purple-50/60" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <AcademicCapIcon className={`h-5 w-5 shrink-0 ${checked ? "text-purple-600" : "text-gray-400"}`} />
                <div className="flex-1">
                  <Typography variant="small" color="blue-gray" className="font-medium">
                    {value}
                  </Typography>
                  <Typography variant="small" className={`text-xs ${checked ? "text-purple-900/70" : "text-gray-600"}`}>
                    {GRADE_LEVEL_AGES[value]} años
                  </Typography>
                </div>
                <Checkbox
                  id={`level-${value}`}
                  crossOrigin={undefined}
                  ripple={false}
                  color="purple"
                  checked={checked}
                  onChange={() => toggleLevel(value)}
                  containerProps={{ className: "p-0 shrink-0" }}
                />
              </label>
            );
          })}
        </div>
        {offeredLevels.length === 0 && (
          <Typography variant="small" className="mt-2 text-red-500 text-xs">
            Selecciona al menos un nivel.
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
