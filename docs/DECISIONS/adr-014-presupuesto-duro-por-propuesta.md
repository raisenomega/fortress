# ADR-014: Presupuesto duro de tokens por propuesta

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Cada eslabón LLM gasta tokens reales. Sin techo, una propuesta patológica
(análisis gigante, generador que itera, revisor sobre diff enorme) puede
consumir sin límite. El coste debe estar acotado POR PROPUESTA, no por día
ni global: el problema es la propuesta desbocada, no el uso legítimo.

## Alternativas consideradas

- **Sin techo, solo observabilidad:** descartada — mirar la factura no la
  frena.
- **Techo global diario:** descartada — una propuesta desbocada agotaría el
  cupo de todas las demás.

## Decisión

Techo duro de 2.000.000 de tokens por propuesta, computado desde la factura
real asentada en el libro de vida.

> **Refinado el 2026-08-23:** la factura incluía la re-lectura del contexto
> (`cache_read`), que resultó ser el 93-96% de lo que reventaba el tope. Ahora
> cuenta solo trabajo real —input, salida y creación de caché— y el generador
> lleva techo de turnos. Ver
> [ADR-068](adr-068-tope-mide-trabajo-y-techo-de-turnos.md). Con reservas mínimas para que ningún
eslabón deje sin combustible al siguiente: 200.000 para el generador y
300.000 para el revisor (ADR-025). Superar el techo rechaza la propuesta.

## Consecuencias

### Positivas
- El peor caso económico de una propuesta está acotado por diseño.
- El gasto se lee del libro (evidencia), no de contadores paralelos.

### Negativas
- Hallazgos legítimamente enormes pueden no caber (señal útil: quizá no
  son para el motor).

### Neutras
- El espécimen del debut usó el 42% del techo: hay margen.

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — presupuestos.
- [AGENTS](../AGENTS.md) — reservas por actor.
