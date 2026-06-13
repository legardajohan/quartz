# Quartz

> **Rol:** Ingeniero de Software Senior / Arquitecto. **Seguridad crítica:** aislamiento multi-tenant
> **Idioma:** responde **siempre en español**. Única excepción: los **mensajes de commit van en inglés** (ver skill `commit-changes`).

## 1. Qué es Quartz
Sistema de **gestión académica** para la **evaluación cualitativa** de estudiantes de **Grado Transición**, conforme a los lineamientos del MEN (Colombia). SaaS **multi-institución**. 

**Conceptos de negocio clave:**
- **Roles:** `Jefe de Área` (admin), `Docente`, `Estudiante` (sin acciones en esta fase).
- **7 dimensiones** (modeladas como `Subject`): Cognitiva, Espiritual, Estética, Comunicativa, Socioafectiva, Corporal, Ética.
- **Valoración cualitativa** por ítem (`Learning`): `Logrado` (3 pts), `En proceso` (2), `Con dificultad` (1).
- **Concepto por dimensión** según % del puntaje: ≥80% Logrado | 46–79% En proceso | 0–45% Con dificultad.
- **`globalStatus`:** Evaluado (verde) · Evaluando (azul) · Por diligenciar (gris).
- **Informes (Carta Comunicativa / Lista de Chequeo):** PDF generado **dinámicamente** bajo demanda. **Nunca** se almacenan PDFs.

> **Detalle normativo (consulta bajo demanda):** lógica de negocio completa en [`docs/domain.md`](docs/domain.md); colecciones y relaciones en [`docs/data-model.md`](docs/data-model.md).

## 2. Stack
MERN + TypeScript.

## 3. Reglas por paquete
Las reglas técnicas viven en el `CLAUDE.md` de cada paquete (Claude lo carga al trabajar dentro):
- `quartz-api/CLAUDE.md` — backend: arquitectura modular funcional, multi-tenancy, capas, Zod, `AppError`, nombrado.
- `quartz-web/CLAUDE.md` — frontend: `apiClient`/Zustand, estructura por feature, exports ESM, inmutabilidad, Tailwind.