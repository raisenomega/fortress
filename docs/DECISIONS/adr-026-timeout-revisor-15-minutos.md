# ADR-026: Timeout del revisor en 15 minutos

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El revisor es un spawn LLM con un servidor de grafo hijo. Sin límite, un
cuelgue bloquearía la cola única de juicios indefinidamente.

## Alternativas consideradas

- **Sin timeout (como el analista):** descartada — el analista corre fuera
  de la cola de juicios; el revisor DENTRO. Un cuelgue suyo congela el
  carril de todos.
- **Timeout corto (cinco minutos):** descartada — diffs y casos grandes
  producirían falsos timeouts; el debut midió juicios de decenas de
  segundos, pero el margen debe cubrir casos legítimos lentos.

## Decisión

Quince minutos de límite. Al excederse, terminación por GRUPO de procesos
con escalada (el servidor de grafo hijo no puede quedar vivo), y rechazo
por timeout con su razón persistida.

## Consecuencias

### Positivas
- La cola de juicios nunca queda secuestrada.

### Negativas
- Un caso legítimo más lento que el límite se rechaza (reintenable no —
  el timeout es razón técnica; se investiga, no se repite a ciegas).

### Neutras
- Mismo valor que el límite del generador; coherencia operativa.

## Referencias

- ADR-017, ADR-020 · [PRINCIPLES](../PRINCIPLES.md) principio 5.
