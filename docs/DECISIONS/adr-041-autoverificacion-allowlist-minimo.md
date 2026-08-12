# ADR-041: Autoverificación del agente con allowlist mínimo

**Estado:** Aceptada
**Fecha:** 2026-08-04
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Tras editar código, un agente debería verificar que no rompió nada
(typecheck, lint, tests). Pero dejar que ejecute cualquier comando sin pedir
permiso es una superficie de riesgo enorme; pedir permiso para CADA comando
convierte el trabajo en un bucle constante de aprobaciones.

## Alternativas consideradas

- **Sin autoverificación (el agente solo edita, el humano verifica):**
  descartada — bucle constante de aprobación; el agente no puede cerrar su
  propio lazo de calidad.
- **Allowlist amplia (cualquier comando de build/test):** descartada —
  superficie de riesgo; un allowlist grande es casi no tener allowlist.

## Decisión

El agente puede ejecutar SIN pedir permiso solo una lista blanca mínima:
`npm run typecheck`, `npm run lint`, `npm run test:unit`. Cualquier otro
comando pide permiso explícito al operador. El allowlist solo aplica si el
proyecto es de confianza (Workspace Trust) y el agente edita.

## Consecuencias

### Positivas
- El agente cierra su lazo de calidad sin fricción, dentro de un techo
  mínimo y auditable.

### Negativas
- Comandos legítimos fuera de la lista (por ejemplo, un build específico)
  piden permiso — el precio del techo estrecho.

### Neutras
- El allowlist es exactamente el gate mínimo del proyecto.

## Referencias

- [SECURITY-MODEL](../SECURITY-MODEL.md) — el allowlist como mitigación.
- [FLOWS/CHAT](../FLOWS/CHAT.md) — la ejecución del agente con frenos.
- ADR-042 (la disciplina de dependencias, del mismo espíritu de techo
  mínimo).
