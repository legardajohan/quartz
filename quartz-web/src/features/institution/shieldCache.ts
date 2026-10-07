// Aislado de useInstitutionShieldQuery.ts para que useAuthStore pueda purgar la caché en
// logout() sin crear un ciclo de imports (ese hook depende de useAuthStore para institutionId).
const SHIELD_CACHE_PREFIX = "quartz:pdf-shield:";

export const shieldCacheKey = (institutionId: string, version: string) =>
  `${SHIELD_CACHE_PREFIX}${institutionId}:${version}`;

export function readShieldFromCache(institutionId: string, version: string): string | undefined {
  try {
    return localStorage.getItem(shieldCacheKey(institutionId, version)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeShieldToCache(institutionId: string, version: string, dataUrl: string): void {
  try {
    const prefix = `${SHIELD_CACHE_PREFIX}${institutionId}:`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key !== shieldCacheKey(institutionId, version)) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(shieldCacheKey(institutionId, version), dataUrl);
  } catch {
    // Modo privado o cuota llena: se pierde la caché, no la generación del PDF.
  }
}

// Purga todas las entradas cacheadas de escudo, de cualquier inquilino: se invoca en
// logout() porque la máquina puede compartirse entre sesiones de distintos inquilinos.
export function purgeAllShieldCacheEntries(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SHIELD_CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Nada que purgar si localStorage no está disponible.
  }
}
