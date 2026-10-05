# Quartz — Roles y permisos

> **Matriz de acciones permitidas por rol de usuario.** Reflierte lo implementado en rutas (`authorize()`) y servicios (checks de *ownership*/sede). Roles definidos en `UserRole` (`quartz-api/src/features/auth/auth.types.ts`). Reglas de negocio: [domain.md](domain.md).

## Roles

| Rol | Alcance |
|---|---|
| **Jefe de Área** (admin) | Toda la institución. Gestiona usuarios, aprendizajes, conceptos, ítems, períodos, sedes y configuración; carga masiva; consolidados. |
| **Docente** | Su sede por defecto. Compone su Lista de Chequeo personal, valora estudiantes y descarga informes de sus grupos. |
| **Estudiante** | Sin acciones en esta fase. |

## Matriz por ámbito y operación

### Gestión de Aprendizajes (`learning`)
| Operación | Jefe de Área | Docente |
|---|---|---|
| Listar aprendizajes | ✅ | ✅ |
| Crear aprendizaje | ✅ | ❌ |
| Editar aprendizaje | ✅ | ❌ |
| Eliminar aprendizaje | ✅ | ❌ |

### Conceptos (`concept`)
| Operación | Jefe de Área | Docente |
|---|---|---|
| Listar conceptos | ✅ (todos) | ✅ (todos, sin filtro de autor) |
| Crear concepto | ✅ | ✅ (queda registrado como autor) |
| Editar concepto | ✅ (todos) | ✅ solo los propios (403 si no es autor) |
| Eliminar concepto | ✅ (todos) | ✅ solo los propios (403 si no es autor) |

### Listas de Chequeo / Plantillas (`checklist-template`)
| Operación | Jefe de Área | Docente |
|---|---|---|
| Listar plantillas | ✅ (todas) | ✅ solo las propias (`teacherId`) |
| Crear plantilla | ✅ | ✅ (máx. 2 por período/docente) |
| Editar plantilla | ✅ (todas) | ✅ solo las propias (403 si no es autor) |
| Eliminar plantilla | ✅ (todas) | ✅ solo las propias (403 si no es autor) |

### Evaluaciones (`student-valuation`)
| Operación | Jefe de Área | Docente |
|---|---|---|
| Inicializar valoración | ✅ | ✅ |
| Consultar valoración por estudiante | ✅ | ✅ |
| Consultar valoración por id | ✅ | ✅ |
| Editar valoración | ✅ | ✅ |
| Actualizar conceptos de la valoración | ✅ | ✅ |
| Eliminar valoración | ✅ | ✅ solo de estudiantes de su sede |

> El Docente queda **restringido a su sede**: `assertStudentInScope` fuerza `schoolId` propio (`req.user`, nunca el `body`) en las 6 operaciones y responde `404` (no `403`) fuera de ella o si el objetivo no es un Estudiante. El Jefe de Área abarca toda la institución.

### Informes (`report`)
| Operación | Jefe de Área | Docente |
|---|---|---|
| Carta Comunicativa (individual) | ✅ | ✅ |
| Lista de Chequeo (individual) | ✅ | ✅ |
| Carta / Lista (bulk) | ✅ | ✅ |
| Carta / Lista (consolidado) | ✅ | ✅ |
| Consultar disponibilidad de Carta | ✅ | ✅ |

> El Docente queda **restringido a su sede**: el service fuerza `schoolId` propio (ignora el del body) y saltan valoraciones de otras sedes. El Jefe de Área abarca toda la institución y puede filtrar por `schoolId`.

### Configuración de la institución (`institution`)
| Operación | Jefe de Área | Docente |
|---|---|---|
| Consultar mi institución (`GET /me`) | ✅ | ❌ |
| Actualizar configuración (`PATCH /me`) | ✅ | ❌ |
| Subir escudo (`PATCH /me/shield`) | ✅ | ❌ |
| Consultar branding (`GET /me/branding`) | ✅ | ✅ |
| Consultar escudo (`GET /me/shield.jpg`) | ✅ | ✅ |

### Configuración de "Gestión" (catálogos)
| Operación | Jefe de Área | Docente |
|---|---|---|
| CRUD de períodos | ✅ | ❌ (GET abierto a cualquier autenticado) |
| CRUD de sedes | ✅ | ❌ (GET abierto a cualquier autenticado) |
| CRUD de dimensiones (`subject`) | ✅ | ❌ (GET abierto a cualquier autenticado) |
| Crear / editar / eliminar usuarios | ✅ | ❌ |
| Listar usuarios | ✅ (todos) | ✅ solo estudiantes de su sede (pedir docentes → `[]`) |
| Subir foto de usuario | ✅ (cualquiera del tenant) | ✅ solo estudiantes de su sede |

## Notas
- **Multi-tenancy:** todas las rutas filtran/forcean `institutionId` desde el token (`requireTenant`); ningún rol accede a datos de otras instituciones.
- **Coherencia:** la matriz implementada concuerda con la regla de dominio: *Docente* valora y modifica su Lista de Chequeo y previsualiza/descarga informes de sus grupos; el resto es del *Jefe de Área*.
- **Alcance por sede cerrado en todos los features:** *Evaluaciones* (`student-valuation.service.ts`, `assertStudentInScope`), *Informes* (`report.service.ts`) y *Usuarios* (`users.service.ts`) aplican el mismo criterio — el Docente solo opera sobre estudiantes de su `schoolId`, tomado de `req.user`; `404` (no `403`) fuera de sede, para no revelar la existencia del recurso.