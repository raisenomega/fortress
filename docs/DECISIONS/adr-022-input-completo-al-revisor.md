# ADR-022: Input completo al revisor

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

¿Qué ve el revisor? Si solo ve el diff, no puede juzgar si el fix respeta
lo que el análisis marcó como intocable ni si resuelve lo que el analista
entendió. Si explora libremente, el coste y la deriva crecen sin control.

## Alternativas consideradas

- **Solo el diff:** descartada — sin el análisis no hay criterio de
  "resuelve" ni de "intocable"; el juicio sería estético.
- **Exploración libre del worktree sin paquete de caso:** descartada —
  coste variable e irreproducible; dos revisiones del mismo fix verían
  mundos distintos.

## Decisión

El revisor recibe el caso COMPLETO y determinista: el análisis original,
el diff entero y los archivos afectados antes y después. Los metadatos del
hallazgo llegan sanitizados; el código va intacto entre delimitadores.

## Consecuencias

### Positivas
- Juicio reproducible y anclado al caso, no a la exploración del día.

### Negativas
- Diffs grandes encarecen el prompt (acotado por la reserva).

### Neutras
- El revisor conserva herramientas de lectura para verificar contra el
  vivo cuando lo necesita.

## Referencias

- [PRINCIPLES](../PRINCIPLES.md) — principio 6 (datos vs metadatos).
- ADR-023.
