# Quartz — Dominio (reglas invariantes)

> Reglas de negocio **estables que todo feature debe respetar**. No las redefinas en specs ni en código: refiérete a este archivo. Detalle de datos en [data-model.md](data-model.md).

## Fase y alcance
- **Actual:** Grado **Transición**, valoración **cualitativa** (Lista de Chequeo → Carta Comunicativa).
- **Futuro (no implementar aún):** Grados 1°–11°, valoración **cuantitativa** (0.0–5.0).

## Roles
| Rol | Puede |
|---|---|
| **Jefe de Área** (admin) | Todo lo del Docente + gestión de usuarios, aprendizajes, conceptos, ítems, períodos y sedes; carga masiva de estudiantes; consolidados. |
| **Docente** | Ver estudiantes (su sede por defecto; filtra otras sedes sin editar); valorar y modificar la Lista de Chequeo; previsualizar/descargar informes de sus grupos. |
| **Estudiante** | Sin acciones en esta fase. |

## Dimensiones
Modeladas como `Subject` (`type: Dimensión`), **por institución**: cada `institutionId` gestiona su propio catálogo desde `Gestión → Configuración` (Jefe de Área). Semilla por defecto al aprovisionar una institución: Cognitiva · Espiritual · Estética · Comunicativa · Socioafectiva · Corporal · Ética — no son una lista cerrada, pueden crearse, editarse o eliminarse.

Cada `Subject` tiene un `evaluationMode`:
- `checklist` (default): se valora por lista de aprendizajes esperados (`Learning`), como se describe más abajo.
- `description`: el docente registra una descripción libre del desempeño por estudiante, sin lista de aprendizajes ni puntaje. No aporta a `totalSubjectScore`/`subjectPercentage` ni recibe `assignedConceptId`.

Cambiar el `evaluationMode` de una dimensión no retro-modifica plantillas (`ChecklistTemplate`) ni valoraciones (`StudentValuation`) ya creadas — ambas embeben un *snapshot* del modo vigente al momento de componerse (ver `docs/data-base.md §2`).

## Jerarquía de la Lista de Chequeo
`Período → Dimensión (Subject) → Aprendizaje Esperado (Learning)`
El docente compone su Lista de Chequeo **personal** (`ChecklistTemplate`) eligiendo `Learning`s por dimensión.

## ChecklistTemplate (Plantilla)
- **Qué es:** Instantánea (snapshot) de las dimensiones y aprendizajes esperados para un período y grado específicos. Contiene nombre, período, grado, autor (docente) y dimensiones con sus aprendizajes embebidos como copia independiente.
- **Propósito:** Base para que el docente construya su Lista de Chequeo personal; no incluye valoraciones de estudiantes ni referencias a `Learning` originales.
- **Regla clave:** Modificar aprendizajes en la tabla `Learning` **no afecta** plantillas ya creadas — cada una tiene su propio snapshot.
- **Eliminar la plantilla no invalida lo ya generado a partir de ella:** `StudentValuation` es autocontenida (snapshot), por lo que sigue siendo visible, editable y reportable aunque su `ChecklistTemplate` de origen se elimine. El informe de Lista de Chequeo usa el nombre real de la plantilla si aún existe, o el texto de respaldo **"Plantilla eliminada"** si ya no (`report.service.ts`).
- **Límite:** Máximo **2 plantillas por período** por docente.

## Valoración cualitativa (por ítem / `Learning`)
| Valoración | Puntos |
|---|---|
| Logrado | 3 |
| En proceso | 2 |
| Con dificultad | 1 |

## Concepto por dimensión (calculado)
1. `totalSubjectScore` = suma de puntos de los ítems valorados de la dimensión.
2. `maxSubjectScore` = nº de ítems de la dimensión × 3.
3. `subjectPercentage` = `totalSubjectScore / maxSubjectScore × 100`.
4. Concepto según el porcentaje:

| % del máximo | Concepto |
|---|---|
| 80–100 | Logrado |
| 46–79 | En proceso |
| 0–45 | Con dificultad |

*Ejemplo:* 5 ítems → máx 15 pts. Logrado 12–15 · En proceso 7–11 · Con dificultad 0–6.

## `globalStatus` (estado de la Lista de Chequeo, calculado)
| Estado | Color | Condición |
|---|---|---|
| Evaluado | Verde | Todos los ítems de todas las dimensiones valorados. |
| Evaluando | Azul | Faltan ítems o dimensiones por valorar. |
| Por diligenciar | Gris | Sin ninguna valoración iniciada. |

## Informes
- **Carta Comunicativa** y **Lista de Chequeo** se generan como **PDF dinámico bajo demanda**, con la valoración más reciente.
- **Nunca** se almacenan PDFs ni versiones previas.
- La previsualización de la Carta exige la Lista de Chequeo **completa**.

## Invariantes transversales
- **Multi-tenancy:** todo dato institucional referencia y se filtra por `institutionId` del **token**. Una fuga entre instituciones es un fallo crítico. (Implementación backend: `quartz-api/CLAUDE.md`.)
- **Un solo `Period` activo** por institución a la vez.
- **Dimensiones** (`Subject` con `institutionId`) son por institución; las materias **globales** futuras llevan `institutionId` nulo.
