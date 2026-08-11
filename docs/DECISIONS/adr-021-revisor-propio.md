# ADR-021: Agente revisor propio (claude-omega)

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El gate prueba que el fix compila; falta quien juzgue que ARREGLA. Ese
juez semántico no puede ser el mismo agente que escribió el fix.

## Alternativas consideradas

- **Que el generador se auto-revise:** descartada — juez y parte; el
  sesgo de autor es exactamente lo que se quiere eliminar.
- **Compartir código de spawn con el generador:** descartada — juez y
  ejecutor no comparten código; la réplica del patrón es deliberada para
  que un cambio en uno no arrastre al otro.

## Decisión

El revisor es un agente PROPIO en lectura estricta (sin edición, sin
shell), con su prompt, su timeout y su reserva de presupuesto. Recibe el
caso completo y devuelve ejes con evidencia.

## Consecuencias

### Positivas
- Independencia real entre quien escribe y quien juzga.

### Negativas
- Un spawn LLM más por propuesta, con su coste (acotado por reserva).

### Neutras
- En la telemetría del libro su etiqueta corta es "omega".

## Referencias

- [AGENTS](../AGENTS.md) — el revisor en detalle.
- ADR-011 (la misma lógica en el generador), ADR-022, ADR-023.
