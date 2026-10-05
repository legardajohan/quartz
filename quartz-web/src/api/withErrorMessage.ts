import { extractErrorMessage } from './apiClient';

// Las mutaciones lanzan `Error` con el mensaje ya resuelto, para que `toast.promise`
// muestre `err.toString()` sin conocer axios. `fallback` puede ser una función para mensajes por status.
export async function withErrorMessage<T>(
  request: () => Promise<T>,
  fallback: string | ((err: unknown) => string),
): Promise<T> {
  try {
    return await request();
  } catch (err: unknown) {
    throw new Error(typeof fallback === 'function' ? fallback(err) : extractErrorMessage(err, fallback));
  }
}
