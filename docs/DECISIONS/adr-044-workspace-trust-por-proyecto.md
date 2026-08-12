# ADR-044: Workspace Trust — confianza por proyecto, default false

**Estado:** Aceptada
**Fecha:** 2026-08-05
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un agente que edita archivos y ejecuta comandos sobre un proyecto es
peligroso si el proyecto no es de confianza — un repo hostil auditado podría
intentar explotar al auditor. Hacía falta un modelo de confianza explícito,
y una decisión sobre su valor por defecto.

## Alternativas consideradas

- **Confianza por defecto (default true):** descartada — expone al operador
  sin una decisión consciente; un proyecto recién llegado tendría poder de
  ejecución sin que nadie lo autorizara.
- **Sin niveles de confianza (todos iguales):** descartada — trata igual a
  un proyecto propio y a uno que llegó de una fuente cualquiera; el auditor
  quedaría a merced del auditado.

## Decisión

Un flag de confianza por proyecto (`trusted`), con default FALSE: opt-in
explícito, nunca opt-out. Sin confianza, el agente es solo lectura estricta
— no hay modo autónomo, no hay edición, no aplica el allowlist de
autoverificación ni el loop. El modelo es Workspace Trust.

## Consecuencias

### Positivas
- Ningún proyecto ejecuta nada sin que el operador lo declare confiable.
- El lado seguro es el default.

### Negativas
- El operador debe activar la confianza a mano en cada proyecto donde quiera
  autonomía (fricción deliberada).

### Neutras
- La confianza es una decisión por proyecto, persistida.

## Referencias

- [SECURITY-MODEL](../SECURITY-MODEL.md) — Workspace Trust como mitigación.
- [FLOWS/CHAT](../FLOWS/CHAT.md) — el modo autónomo exige confianza.
- ADR-041 (el allowlist que solo aplica bajo confianza).
