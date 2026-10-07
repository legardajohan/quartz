export type ValuationState =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'CREATED'
  | 'NOT_STARTED';

// Mapa de estados recibidos de la API a nuestros estados de dominio
export const API_STATUS_TO_VALUATION_STATE: { [key: string]: ValuationState } = {
  Evaluado: 'COMPLETED',
  Evaluando: 'IN_PROGRESS',
  'Por diligenciar': 'CREATED',
};

export function getValuationState(status: string | null | undefined): ValuationState {
  if (!status) return 'NOT_STARTED';
  return API_STATUS_TO_VALUATION_STATE[status] || 'NOT_STARTED';
}

export const VALUATION_STATE_ORDER: ValuationState[] = ['COMPLETED', 'IN_PROGRESS', 'CREATED', 'NOT_STARTED'];

export const VALUATION_STATE_LABELS: Record<ValuationState, string> = {
  COMPLETED: 'Evaluado',
  IN_PROGRESS: 'Evaluando',
  CREATED: 'Por diligenciar',
  NOT_STARTED: 'Sin iniciar',
};