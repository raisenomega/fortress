# ADR-052: Gate por kind — reversible avanza solo, agente exige humano

**Estado:** Aceptada
**Fecha:** 2026-08-07
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Cuando una capacidad acumula evidencia suficiente, ¿quién autoriza su
promoción? Exigir firma humana para todo frena operaciones intrínsecamente
seguras; permitir que todo ascienda solo pondría un agente nuevo en
circulación sin que nadie lo aprobara.

## Alternativas consideradas

- **Un flag "reversible" configurable por capacidad:** descartada — el
  operador podría marcar un agente como reversible para saltar el gate; la
  reversibilidad no puede ser una casilla.
- **Firma humana para toda promoción:** descartada — freno excesivo para
  funciones y herramientas que son intrínsecamente reversibles (un toggle
  las apaga sin residuo).

## Decisión

La reversibilidad es una propiedad ESTRUCTURAL del kind, no un flag. Función
y herramienta son reversibles: promueven solas si OMEGA no veta. Un agente
es irreversible (altera el catálogo de despacho): SIEMPRE exige firma humana,
aunque OMEGA apruebe. El operador no puede marcar un agente como reversible
para saltar el gate.

## Consecuencias

### Positivas
- Autonomía donde es segura (reversible), firma donde importa (irreversible),
  sin que el operador pueda relajar el criterio.

### Negativas
- La clasificación por kind es fija; una capacidad ambigua no tiene término
  medio.

### Neutras
- OMEGA frena en cualquier caso; el gate por kind decide quién avanza.

## Referencias

- [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md) — el gate por kind.
- [FLOWS/GENESIS](../FLOWS/GENESIS.md) — el bucle que lo respeta.
- ADR-051 (el ciclo cuyas fases este gate promueve).
