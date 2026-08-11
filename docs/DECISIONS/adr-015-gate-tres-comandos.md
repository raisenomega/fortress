# ADR-015: El gate son los tres comandos del humano

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

¿Qué corre el gate? La respuesta define qué significa "verde". Debe ser
exactamente lo que un humano del proyecto correría antes de confiar en un
cambio — ni menos (falso verde) ni más (juicios eternos).

## Alternativas consideradas

- **Suite completa incluida la integración:** descartada — la integración
  levanta Electron y tarda minutos extra; además exige entorno gráfico que
  el worktree del gate no garantiza.
- **Solo tests unitarios:** descartada — un fix puede pasar tests y romper
  tipos o lint; el humano no confiaría, el gate tampoco debe.

## Decisión

El gate ejecuta, en orden fijo y cada uno bloqueante: typecheck, lint y
tests unitarios (tras la instalación limpia). Es el mismo gate mínimo que
la disciplina del repo exige a cualquier commit humano.

## Consecuencias

### Positivas
- "Verde" significa lo mismo para el motor que para un humano.

### Negativas
- La integración no se juzga aquí (la cubre la verificación del proyecto
  en sus propios ciclos).

### Neutras
- El orden fijo hace las autopsias comparables entre propuestas.

## Referencias

- ADR-004 · [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md).
