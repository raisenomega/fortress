# ADR-018: El estado GATE significa "pasado, esperando revisor"

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

¿Qué representa el estado GATE en la máquina? Si significara "en juicio",
habría que persistir un estado RUNNING — y un RUNNING persistido queda
huérfano si la aplicación muere a mitad.

## Alternativas consideradas

- **Estado RUNNING persistido:** descartada — huérfanos tras cierres
  abruptos; exigiría reclamos y relojes para un dato que la cola de
  proceso ya conoce.
- **Booleano "gate_passed" fuera de la máquina:** descartada — dos fuentes
  de verdad para un solo flujo.

## Decisión

GATE es un estado de RESULTADO: el juicio mecánico pasó y la propuesta
espera al revisor. El "en curso" vive en la cola de proceso (memoria), no
en la base. El que falla no entra a GATE: va a RECHAZADO con autopsia.

## Consecuencias

### Positivas
- La máquina solo persiste hechos consumados; cero huérfanos de estado.

### Negativas
- La interfaz necesita el estado vivo por otra vía (push de proceso).

### Neutras
- El mismo patrón se aplicó al estado OMEGA (ADR-024).

## Referencias

- [PRINCIPLES](../PRINCIPLES.md) — principio 11 (la cola es de proceso).
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la máquina de estados.
