# ADR-025: Reserva de presupuesto para el revisor

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Si el análisis y la generación consumen el presupuesto entero, la
propuesta llega al revisor sin combustible: fix generado, juicio
imposible. Peor final no hay — todo el gasto sin veredicto.

## Alternativas consideradas

- **Juzgar siempre aunque rompa el techo:** descartada — el techo dejaría
  de ser duro; la excepción se vuelve la regla.
- **Una única reserva compartida para "lo que quede":** descartada — no
  garantiza nada a nadie; el último eslabón siempre pierde.

## Decisión

Reserva mínima explícita para el revisor (300.000 tokens): antes de
lanzarlo, el motor verifica que el gasto acumulado más la reserva cabe en
el techo. Si no cabe, la propuesta se rechaza por presupuesto ANTES de
gastar más. (El generador tiene su propia reserva menor, de 200.000.)

## Consecuencias

### Positivas
- Ninguna propuesta termina "generada pero injuzgable".
- El rechazo por presupuesto llega temprano y barato.

### Negativas
- Propuestas al borde del techo se rechazan aunque quizá hubieran cabido
  (conservador a propósito).

### Neutras
- Los valores son parámetros de diseño públicos y ajustables por firma.

## Referencias

- ADR-014 · [AGENTS](../AGENTS.md).
