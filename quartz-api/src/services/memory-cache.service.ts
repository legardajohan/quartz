/**
 * Caché en memoria por proceso: la promesa del productor se guarda, no el valor, para que
 * peticiones equivalentes en vuelo compartan una sola ejecución (dedupe). Si el productor
 * rechaza, la entrada se borra de inmediato: un fallo nunca queda cacheado.
 */

interface CacheEntry {
  promise: Promise<unknown>;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();
const MAX_ENTRIES = 500;

function purgeExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

export function getOrSet<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T> {
  purgeExpired();

  const existing = store.get(key);
  if (existing) {
    return existing.promise as Promise<T>;
  }

  const promise = producer().catch(error => {
    store.delete(key);
    throw error;
  });

  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) {
      store.delete(oldestKey);
    }
  }

  store.set(key, { promise, expiresAt: Date.now() + ttlMs });

  return promise as Promise<T>;
}

export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export function clearCache(): void {
  store.clear();
}
