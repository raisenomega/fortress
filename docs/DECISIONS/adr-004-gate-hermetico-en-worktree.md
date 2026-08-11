# ADR-004: Gate hermético en worktree con instalación limpia

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un fix generado por un agente necesita un juicio mecánico antes de cualquier
juicio semántico: ¿compila?, ¿pasa lint?, ¿pasan los tests? Ese juicio debe
correr donde el fix vive (el worktree) y no puede heredar estado del árbol
vivo, o el veredicto no sería del fix sino del entorno.

## Alternativas consideradas

- **Confiar en el auto-reporte del agente ("corrí los tests"):** descartada
  — al agente no se le cree por fe; el veredicto lo produce el motor.
- **Verificar en el árbol vivo del proyecto:** descartada — contamina el
  espacio del operador y mezcla estados.

## Decisión

El gate corre DENTRO del worktree de la propuesta, empezando por una
instalación limpia de dependencias y siguiendo con los mismos comandos que
un humano correría. Verde avanza; rojo rechaza con autopsia persistida.

## Consecuencias

### Positivas
- El veredicto es del fix, reproducible y hermético.
- La autopsia (colas de salida por comando) hace el diagnóstico barato.

### Negativas
- La instalación limpia cuesta minutos por juicio.

### Neutras
- El gate es un actor no-LLM: no gasta tokens ([AGENTS](../AGENTS.md)).

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — eslabón 4.
- ADR-015, ADR-016, ADR-017 (los detalles del gate).
