import axios from 'axios';
import { extractErrorMessage } from './apiClient';

const VERSION_CONFLICT = 'VERSION_CONFLICT';

// `status` y `code` permiten distinguir conflictos (409 VERSION_CONFLICT) y recursos inexistentes (404)
// sin perder el mensaje ya resuelto. `name = 'Error'` mantiene el texto de `err.toString()` en los toasts.
export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'Error';
    this.status = status;
    this.code = code;
  }
}

export function isVersionConflict(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409 && err.code === VERSION_CONFLICT;
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

// Las mutaciones lanzan `Error` con el mensaje ya resuelto, para que `toast.promise`
// muestre `err.toString()` sin conocer axios. `fallback` puede ser una función para mensajes por status.
export async function withErrorMessage<T>(
  request: () => Promise<T>,
  fallback: string | ((err: unknown) => string),
): Promise<T> {
  try {
    return await request();
  } catch (err: unknown) {
    const message = typeof fallback === 'function' ? fallback(err) : extractErrorMessage(err, fallback);
    const response = axios.isAxiosError(err) ? err.response : undefined;
    const code = (response?.data as { code?: unknown } | undefined)?.code;
    throw new ApiError(message, response?.status, typeof code === 'string' ? code : undefined);
  }
}
