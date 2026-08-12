# ADR-048: Knowledge Graph vía MCP, grafo primero

**Estado:** Aceptada
**Fecha:** 2026-08-06
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Los agentes necesitan ubicar símbolos, dependencias y contexto del código.
Hacerlo leyendo archivos enteros cuesta miles de tokens por consulta — a
escala, insostenible. Hacía falta una forma barata de navegar el código, y
decidir si construirla o adoptarla.

## Alternativas consideradas

- **Un índice de código interno propio:** descartada — reinventar la rueda;
  añade una pieza compleja que mantener cuando existe un servicio adecuado.
- **Sin grafo (los agentes navegan por grep y lectura):** descartada —
  lento y superficial; cada consulta gastaría entre 5.000 y 50.000 tokens
  por archivo, lo que hace el proyecto insostenible a escala.

## Decisión

Un Knowledge Graph externo (servidor MCP de memoria de código) que viaja en
cada spawn de agente. Doctrina "grafo primero": consultar el grafo antes de
leer un archivo — misma respuesta, ~100 veces menos tokens. Solo se abre un
archivo cuando se necesita el código EXACTO que el grafo no devuelve. El
grafo se realinea con el HEAD automáticamente.

## Consecuencias

### Positivas
- Ahorro de tokens real (una consulta al grafo cuesta lo que una fracción de
  leer un archivo); el proyecto se vuelve sostenible a escala.

### Negativas
- Depende de un servicio externo (fijado por versión, ADR-042) y de que el
  índice esté alineado.

### Neutras
- La proyección del estado del índice vive en la base; el índice mismo, en
  el servicio.

## Referencias

- [FLOWS/GRAPH-REINDEX](../FLOWS/GRAPH-REINDEX.md) — el realineado
  automático.
- [ARCHITECTURE](../ARCHITECTURE.md) — el grafo en la infraestructura.
- [PRINCIPLES](../PRINCIPLES.md) — grafo primero, archivo después.
