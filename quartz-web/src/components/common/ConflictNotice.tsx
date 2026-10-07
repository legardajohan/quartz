import { useEffect, useRef, useState } from "react";
import { Button } from "@material-tailwind/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export interface ConflictChange {
  label: string;
  from?: string;
  to?: string;
  detail?: string;
}

export interface ConflictNoticeProps {
  title: string;
  changes: ConflictChange[];
  summary?: string;
  isSaving: boolean;
  onKeepMine: () => void;
  onUseCurrent: () => void;
}

function ChangeItem({ change }: { change: ConflictChange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="text-sm text-amber-900">
      <span className="font-medium">{change.label}</span>
      {change.from !== undefined && change.to !== undefined && (
        <span>: {change.from} → {change.to}</span>
      )}
      {change.detail && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="ml-2 text-xs font-medium underline underline-offset-2 hover:text-amber-950"
          >
            {expanded ? "Ocultar" : "Ver cómo quedó"}
          </button>
          {expanded && <p className="mt-1 whitespace-pre-wrap text-amber-800">{change.detail}</p>}
        </>
      )}
    </li>
  );
}

export default function ConflictNotice({
  title,
  changes,
  summary,
  isSaving,
  onKeepMine,
  onUseCurrent,
}: ConflictNoticeProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Foco al montar y cada vez que el aviso se actualiza con cambios nuevos.
  useEffect(() => {
    ref.current?.focus();
  }, [changes, summary]);

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-xl border border-amber-300 bg-amber-50 p-4 outline-none animate-notice-in motion-reduce:animate-none"
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">{title}</p>
          <p className="mt-1 text-sm text-amber-900">
            Mientras editabas, otra persona guardó cambios. Lo que escribiste sigue aquí y aún no se ha guardado.
          </p>
          {summary && <p className="mt-2 text-sm font-medium text-amber-900">{summary}</p>}
          {changes.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {changes.map((change) => (
                <ChangeItem key={change.label} change={change} />
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="sm"
              color="amber"
              ripple={false}
              loading={isSaving}
              disabled={isSaving}
              onClick={onKeepMine}
              className="active:scale-[0.97]"
            >
              Guardar mis cambios
            </Button>
            <Button
              type="button"
              size="sm"
              variant="text"
              color="amber"
              ripple={false}
              disabled={isSaving}
              onClick={onUseCurrent}
              className="active:scale-[0.97]"
            >
              Usar la versión actual
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
