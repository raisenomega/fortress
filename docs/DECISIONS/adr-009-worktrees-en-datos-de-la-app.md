# ADR-009: Worktrees del motor en los datos de la aplicación

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El generador necesita un espacio de trabajo aislado. ¿Dónde viven esos
worktrees? La respuesta define quién los ve, quién los limpia y qué pasa
con ellos cuando la aplicación se reinicia.

## Alternativas consideradas

- **Carpeta oculta dentro del repo del proyecto:** descartada — contamina
  el `git status` del operador y mezcla espacio del motor con espacio
  humano.
- **Directorio temporal del sistema:** descartada — el sistema lo limpia
  cuando quiere; se perdería la autopsia de un rechazo.

## Decisión

Los worktrees viven en la carpeta de datos de la aplicación (una subcarpeta
dedicada), fuera del árbol de todo proyecto. La aplicación es dueña de su
ciclo de vida: los conserva para autopsia en rechazos post-generación y los
reclama al arrancar si quedaron huérfanos.

## Consecuencias

### Positivas
- El proyecto del operador nunca ve basura del motor.
- Autopsia disponible tras cualquier rechazo.

### Negativas
- Espacio en disco bajo la aplicación (mitigado por limpieza y reclamo).

### Neutras
- La ubicación es un dato de la app, no del proyecto.

## Referencias

- [GLOSSARY](../GLOSSARY.md) — repair-worktrees.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md).
