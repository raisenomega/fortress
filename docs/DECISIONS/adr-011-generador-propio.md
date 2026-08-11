# ADR-011: Agente generador propio, separado del analista

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El eslabón de entender y el de generar podían compartir agente: mismo
binario, mismo patrón de spawn. Pero sus contratos son opuestos — uno es
solo-lectura con veredicto, el otro edita con correa.

## Alternativas consideradas

- **Reusar el analista con permisos de edición:** descartada — mezcla
  permisos (el analista DEBE ser incapaz de editar) y acopla prompts con
  propósitos distintos.
- **Un solo agente end-to-end (entiende y arregla):** descartada — sin
  frontera entre análisis y edición no hay dónde poner la correa ni el
  veredicto OBSOLETO.

## Decisión

El generador es un agente PROPIO, con su prompt, sus permisos (el único que
edita, sin shell) y su timeout. Replica el patrón de spawn del analista a
propósito: duplicación controlada antes que acoplamiento.

## Consecuencias

### Positivas
- Permisos mínimos por eslabón; frontera limpia análisis/edición.

### Negativas
- Dos patrones de spawn casi iguales que mantener (aceptado y anotado).

### Neutras
- La factura de tokens se reporta por actor, separada.

## Referencias

- [AGENTS](../AGENTS.md) — los cuatro actores.
- ADR-021 (la misma lógica aplicada al revisor).
