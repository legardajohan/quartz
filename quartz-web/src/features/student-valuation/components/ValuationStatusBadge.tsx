import { Chip } from '@material-tailwind/react';
import { ValuationState } from '../types/domain';

interface StatusConfig {
  label: string;
  color: 'green' | 'blue' | 'gray';
  variant: 'ghost' | 'filled';
  className: string;
  dotColor: string;
}

const VALUATION_STATES: Record<ValuationState, StatusConfig> = {
  COMPLETED: {
    label: 'Evaluado',
    color: 'green',
    variant: 'ghost',
    className: 'bg-green-50 text-green-900',
    dotColor: 'bg-green-500',
  },
  IN_PROGRESS: {
    label: 'Evaluando',
    color: 'blue',
    variant: 'ghost',
    className: 'bg-blue-50 text-blue-900',
    dotColor: 'bg-blue-500',
  },
  CREATED: {
    label: 'Por diligenciar',
    color: 'gray', // blue-gray no es un color de Chip, usamos gray
    variant: 'ghost',
    className:
      'bg-blue-gray-50 text-blue-gray-900',
    dotColor: 'bg-gray-500',
  },
  NOT_STARTED: {
    label: 'Sin iniciar',
    color: 'gray',
    variant: 'filled',
    className:
      'bg-transparent text-blue-gray-400 border-2 border-blue-gray-200',
    dotColor: 'bg-gray-400',
  },
};

export const ValuationStatusBadge = ({ status, customLabel }: { status: ValuationState; customLabel?: string }) => {
  const config = VALUATION_STATES[status] || VALUATION_STATES.NOT_STARTED;

  // El componente Chip de Material Tailwind no soporta todas las clases de Tailwind directamente.
  // Por eso, usamos 'color' y 'variant' para el estilo base y 'className' para los ajustes finos.
  return (
    <Chip
      size="sm"
      value={
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${config.dotColor}`} />
          {customLabel || config.label}
        </div>
      }
      color={config.color}
      variant={config.variant}
      className={`rounded-full normal-case text-xs font-bold ${config.className} px-3 py-1`}
    />
  );
};
