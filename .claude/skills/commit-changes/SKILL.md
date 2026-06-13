---
name: commit-changes
description: >
  Commits pending changes.
  To be used for committing code changes in a git repository.
---

# Habilidad para Confirmar Cambios

> **Idioma (obligatorio):** los **mensajes de commit se escriben siempre en inglés** — tipo, descripción, cuerpo y pie — aunque el resto de la conversación sea en español.

Cuando se solicite realizar commits, sigue estos pasos:

1. **Verificar cambios sin confirmar**:
   - Usa `git status` para comprobar si existen cambios pendientes por confirmar.

2. **Agrupar cambios**:
   - Si hay múltiples archivos modificados, agrúpalos de forma lógica cuando sea posible.
   - Define mensajes de commit claros y significativos para cada grupo.

3. **Preparar cambios (stage)**:
   - Agrega los cambios al área de preparación usando `git add` para cada grupo de archivos.

4. **Escribir mensajes de commit**:
    - Sigue el formato de Commits Convencionales:

      ```txt
      <tipo>[alcance opcional]: <descripción>

      [cuerpo opcional]

      [pie opcional]
      ```
    4.1.  Tipos de Cambios

      * `feat`: nueva funcionalidad
      * `fix`: corrección de errores
      * `test`: agregar o corregir pruebas
      * `perf`: mejoras de rendimiento del código
      * `refactor|style`: limpieza o mejora del código
      * `docs`: cambios únicamente en documentación
      * `chore|build|ci`: cambios en procesos de construcción o herramientas auxiliares
      * Cambios incompatibles (**breaking changes**) (indicados con `!` o `BREAKING CHANGE`)

    4.2. Descripción del Mensaje

      * Resumen conciso del cambio realizado.
      * Prioriza ajustarse a 50 caracteres antes que la gramática.
      * Agrega referencias a issues o tickets cuando aplique.

    4.3. Cuerpo y Pie

      * **Cuerpo**: explicación detallada del cambio.
      * **Pie**: referencias a issues o cambios incompatibles.
      * Prioriza ajustarse a 72 caracteres antes que la gramática.
