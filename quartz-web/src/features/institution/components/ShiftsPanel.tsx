import { useState, useEffect, useRef } from "react";
import { Switch, Input, IconButton, Typography } from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useInstitutionStore } from "../useInstitutionStore";
import { extractErrorMessage } from "@/api/apiClient";
import type { ShiftDto } from "../types";

interface ShiftDraft {
  key: string;
  _id?: string;
  name: string;
}

function draftsFromShifts(shifts: ShiftDto[]): ShiftDraft[] {
  return shifts.map((s) => ({ key: s._id, _id: s._id, name: s.name }));
}

export function ShiftsPanel() {
  const { institution, isLoading, isSubmitting, error, fetchInstitution, updateSettings } = useInstitutionStore();

  const [multipleShifts, setMultipleShifts] = useState(false);
  const [drafts, setDrafts] = useState<ShiftDraft[]>([]);
  const nextKeyRef = useRef(0);

  useEffect(() => {
    fetchInstitution();
  }, [fetchInstitution]);

  useEffect(() => {
    if (institution) {
      setMultipleShifts(institution.settings.multipleShifts);
      setDrafts(draftsFromShifts(institution.settings.shifts));
    }
  }, [institution]);

  const addDraft = () => {
    nextKeyRef.current += 1;
    setDrafts((prev) => [...prev, { key: `new-${nextKeyRef.current}`, name: "" }]);
  };

  const updateDraftName = (key: string, name: string) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, name } : d)));
  };

  const removeDraft = (key: string) => {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  };

  const trimmedNames = drafts.map((d) => d.name.trim());
  const hasEmptyNames = trimmedNames.some((n) => n === "");
  const hasDuplicateNames = new Set(trimmedNames.map((n) => n.toLowerCase())).size !== trimmedNames.length;
  const emptyListWhileOn = multipleShifts && drafts.length === 0;

  const isDirty = institution
    ? institution.settings.multipleShifts !== multipleShifts ||
      JSON.stringify(draftsFromShifts(institution.settings.shifts)) !== JSON.stringify(drafts)
    : false;

  const isSubmitDisabled = isSubmitting || !isDirty || emptyListWhileOn || hasEmptyNames || hasDuplicateNames;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (emptyListWhileOn) {
      toast.error("Debes registrar al menos una jornada.");
      return;
    }
    if (hasEmptyNames) {
      toast.error("Ninguna jornada puede tener el nombre vacío.");
      return;
    }
    if (hasDuplicateNames) {
      toast.error("Hay jornadas con el nombre repetido.");
      return;
    }

    const promise = updateSettings({
      multipleShifts,
      shifts: drafts.map((d) => (d._id ? { _id: d._id, name: d.name.trim() } : { name: d.name.trim() })),
    });
    toast.promise(promise, {
      loading: "Guardando jornadas...",
      success: <b>¡Jornadas actualizadas con éxito!</b>,
      error: (err) => <b>{extractErrorMessage(err, "No se pudo actualizar la configuración de jornadas.")}</b>,
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
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-6">
      <div>
        <Typography variant="h6" color="blue-gray" className="font-bold">
          Jornadas
        </Typography>
        <Typography variant="small" className="text-gray-500">
          Define si tu institución maneja varias jornadas (mañana, tarde, nocturno, ciclos).
        </Typography>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <div>
          <Typography variant="small" color="blue-gray" className="font-medium">
            Maneja varias jornadas
          </Typography>
          <Typography variant="small" className="text-gray-500 text-xs">
            Habilita la asignación de jornada al registrar estudiantes.
          </Typography>
        </div>
        <Switch
          color="purple"
          checked={multipleShifts}
          onChange={(e) => setMultipleShifts(e.target.checked)}
          crossOrigin="anonymous"
        />
      </div>

      {multipleShifts && (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div key={draft.key} className="flex items-center gap-2">
              <Input
                color="purple"
                label="Nombre de la jornada"
                value={draft.name}
                onChange={(e) => updateDraftName(draft.key, e.target.value)}
                crossOrigin="anonymous"
                containerProps={{ className: "flex-1" }}
              />
              <IconButton
                size="sm"
                color="white"
                className="text-gray-600 shadow-none hover:shadow-md hover:text-pink-500 transition-all border border-gray-200 shrink-0"
                onClick={() => removeDraft(draft.key)}
              >
                <TrashIcon className="h-4 w-4" />
              </IconButton>
            </div>
          ))}

          <button
            type="button"
            onClick={addDraft}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={2} />
            Agregar jornada
          </button>

          {emptyListWhileOn && (
            <Typography variant="small" className="text-red-500 text-xs">
              Debes registrar al menos una jornada.
            </Typography>
          )}
          {!emptyListWhileOn && hasDuplicateNames && (
            <Typography variant="small" className="text-red-500 text-xs">
              Hay jornadas con el nombre repetido.
            </Typography>
          )}
        </div>
      )}

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
