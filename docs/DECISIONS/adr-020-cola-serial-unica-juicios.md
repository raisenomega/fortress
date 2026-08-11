# ADR-020: Cola serial única para los juicios

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El gate satura CPU y disco (instalación + suites); el revisor lanza un
agente con su servidor de grafo. Dos juicios simultáneos compiten por la
máquina y ensucian las facturas de duración.

## Alternativas consideradas

- **Juicios en paralelo:** descartada — contención de recursos y
  duraciones no comparables entre propuestas.
- **Cola persistida en base:** descartada — estado RUNNING huérfano tras
  un cierre; la cola es asunto del proceso vivo.

## Decisión

Una cola serial de UNO a nivel de proceso, COMPARTIDA por gate y revisor:
en toda la aplicación hay a lo sumo un juicio corriendo. En memoria; al
arrancar no hay nada que reclamar de la cola misma.

## Consecuencias

### Positivas
- Duraciones limpias y comparables; la máquina nunca se satura por dos
  juicios.

### Negativas
- Con muchas propuestas, los juicios esperan turno (aceptado: el debut es
  de baja concurrencia).

### Neutras
- El mismo mecanismo de cola genérica sirve a ambos juicios.

## Referencias

- [PRINCIPLES](../PRINCIPLES.md) — principio 11.
- [AGENTS](../AGENTS.md) — gate y revisor.
