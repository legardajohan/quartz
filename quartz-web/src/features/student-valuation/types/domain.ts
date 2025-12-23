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