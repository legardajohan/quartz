---
name: clean-code-solid
description: Aplica principios de Clean Code y SOLID adaptados al monolito modular funcional de Quartz (quartz-api y quartz-web). Úsala al implementar features, refactorizar, revisar estructura o cuando un archivo/función crezca demasiado. Garantiza capas delgadas, responsabilidad única, dependencias hacia abstracciones y nombres por intención.
---

# Clean Code & SOLID — Quartz (estilo funcional)

Quartz usa patrón **funcional** (sin clases en controllers/services), así que SOLID se aplica a **módulos y funciones**. Reglas por paquete: `quartz-api/CLAUDE.md` y `quartz-web/CLAUDE.md`.

## SOLID adaptado

- **S — Responsabilidad única:** cada capa hace una sola cosa. Controller = solo HTTP (extrae datos, responde). Service = solo negocio. Model = solo persistencia. Componente React = solo presentación; el fetching vive en el store/hook.
- **O — Abierto/cerrado:** extiende vía nuevas funciones o helpers (`build<X>Query`, `populate<X>Details`), no modificando firmas estables compartidas.
- **L — Sustitución:** los DTOs derivados (`Omit/Pick`) deben ser usables donde se espera el tipo base sin sorpresas.
- **I — Segregación de interfaces:** tipos pequeños y específicos (`Create<X>DTO`, `Update<X>DTO`) en vez de un mega-tipo con todo opcional.
- **D — Inversión de dependencias:** depende de abstracciones del proyecto: backend → `base.repository` y modelos; frontend → `apiClient` y stores. Nunca `fetch`/`axios` directo ni queries Mongoose dispersas en controllers.

## Clean Code

1. **Funciones pequeñas** (≤ 40 líneas objetivo) y de un solo nivel de abstracción.
2. **Nombres por intención:** verbos en funciones (`initializeStudentValuation`), sustantivos en datos. Sin abreviaturas crípticas.
3. **Capas delgadas:** cero lógica de negocio en controllers o componentes; cero acceso a Mongoose fuera de services.
4. **Manejo de errores explícito:** backend lanza `AppError(msg, statusCode)` para fallos esperables; el controller los traduce a HTTP. Frontend captura y muestra feedback con `react-hot-toast`.
5. **Sin duplicación:** extrae helpers/hook reutilizables; reutiliza `components/ui` y `components/common`.
6. **Límites de tamaño:** si un archivo o función crece demasiado, divide por responsabilidad antes de continuar.
7. **Co-localización por feature:** mantén el *vertical slice* junto; no crees carpetas técnicas globales nuevas.

## Multi-tenancy es parte de la calidad
Una función de service "limpia" que olvida filtrar por `institutionId` es un **defecto crítico**, no un detalle. Toda lectura/escritura backend incluye el tenant del token.

## Procedimiento de refactor
1. Identifica la responsabilidad que sobra en el archivo/función.
2. Extrae a service/helper/hook/subcomponente con nombre por intención.
3. Verifica: `npx tsc --noEmit` (api) o `npm run build && npm run lint` (web).
4. Confirma que el comportamiento externo no cambió.
