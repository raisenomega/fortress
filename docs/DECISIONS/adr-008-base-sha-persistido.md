# ADR-008: base_sha persistido como base del worktree

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un fix se entiende y se genera contra UN estado del código. Si el proyecto
avanza mientras la propuesta vive, ¿contra qué base se generó el diff, se
corrió el gate, juzgó el revisor? Sin respuesta exacta no hay
reproducibilidad ni auditoría.

## Alternativas consideradas

- **Worktree sobre el HEAD del momento de cada eslabón:** descartada — cada
  eslabón juzgaría un código distinto; el veredicto final no sería de nada.
- **Rebase automático al avanzar main:** descartada — un rebase silencioso
  puede introducir conflictos semánticos que ningún gate mecánico ve.

## Decisión

El SHA del HEAD se ancla al nacer la propuesta y se persiste. El worktree se
crea SIEMPRE sobre ese `base_sha`. Si la rama principal se mueve antes de la
firma, la propuesta caduca: nunca rebase automático. Reintentar crea una
propuesta nueva sobre el HEAD fresco.

## Consecuencias

### Positivas
- Reproducibilidad estricta: todos los eslabones juzgan el mismo mundo.

### Negativas
- Propuestas pueden caducar por avance normal del proyecto (aceptado: es
  el costo de la honestidad).

### Neutras
- La caducidad alimenta el flujo de reintento ([FLOWS/RETRY](../FLOWS/RETRY.md)).

## Referencias

- [DATA-MODEL](../DATA-MODEL.md) — la columna en el expediente.
- ADR-029 (el reintento con base fresca).
