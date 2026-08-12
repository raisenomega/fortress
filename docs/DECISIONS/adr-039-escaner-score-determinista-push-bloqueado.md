# ADR-039: Escáner de seguridad con score determinista y push bloqueado por CRITICAL

**Estado:** Aceptada
**Fecha:** 2026-08-04
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El escaneo de seguridad es una función central: detecta hallazgos y produce
una nota. Dos decisiones definen su honestidad: cómo se calcula esa nota, y
qué pasa cuando hay vulnerabilidades críticas. Un score que un modelo
"opina" no sería reproducible; un sistema que deja empujar con un CRITICAL
abierto expone al operador a un merge peligroso.

## Alternativas consideradas

- **Score calculado por un LLM que juzga:** descartada — no determinista;
  la misma base daría notas distintas en corridas distintas, y un score que
  fluctúa no es una señal fiable.
- **Sin bloqueo de push:** descartada — dejaría al operador empujar código
  con vulnerabilidades críticas abiertas; la nota sería decorativa.

## Decisión

El score es DETERMINISTA (6 dimensiones, penalización por severidad con
reglas fijas): la misma entrada da la misma nota. Y una regla pura de
dominio bloquea el push cuando el último escaneo dejó al menos un CRITICAL
abierto, con su razón visible. Se levanta resolviendo el hallazgo o
descartándolo explícitamente.

## Consecuencias

### Positivas
- La nota es reproducible y auditable; el bloqueo protege al operador de
  merges peligrosos.

### Negativas
- Un score determinista no captura matices que un juicio humano sí; es una
  señal, no un veredicto final.

### Neutras
- El escáner nunca se autoverifica: auditar es mirar.

## Referencias

- [FLOWS/SCAN](../FLOWS/SCAN.md) — el flujo, las dimensiones y el push
  bloqueado.
- [SECURITY-MODEL](../SECURITY-MODEL.md) — el escaneo en el modelo de
  amenazas.
- Ver ADR-001 (Score honesto por expediente ACTIVE) para el refinamiento
  cronológico del score en el motor de auto-reparación: el score pasó a
  puntuar el expediente completo (reportados + ACTIVE no nombrados), no solo
  la corrida.
