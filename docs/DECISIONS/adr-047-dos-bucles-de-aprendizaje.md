# ADR-047: Los dos bucles de aprendizaje

**Estado:** Aceptada
**Fecha:** 2026-08-05
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un sistema que solo ejecuta no mejora. Para que FORTRESS acumule calidad y
memoria hacían falta lazos de realimentación: uno técnico (el agente cierra
su propio lazo tras editar) y uno cognitivo (el sistema recuerda lo
aprendido entre sesiones). La cuestión era si tratarlos como uno o como dos.

## Alternativas consideradas

- **Sin bucles de aprendizaje:** descartada — el sistema no acumularía ni
  calidad ni memoria; cada sesión empezaría de cero.
- **Un único bucle consolidado:** descartada — mezclaría la autoverificación
  TÉCNICA (compila, pasa tests) con la reflexión SEMÁNTICA (qué se aprendió);
  son realimentaciones de naturaleza distinta.

## Decisión

Dos bucles separados. Bucle técnico: tras un cambio, el agente corre su
allowlist (typecheck, lint, tests unitarios) y se corrige — cierra su lazo
de calidad sin intervención humana (ADR-041). Bucle cognitivo: tras cada
escaneo, el MOTOR (no el LLM) reescribe de forma determinista el
COGNITION-LOG del proyecto — patrones al día, reflexión de la corrida.

## Consecuencias

### Positivas
- La calidad se cierra en cada cambio; la memoria persiste entre sesiones.

### Negativas
- Dos mecanismos que mantener en vez de uno (a cambio de no mezclar
  registros distintos).

### Neutras
- El COGNITION-LOG vive como archivo en el proyecto, no en la base.

## Referencias

- [FLOWS/CHAT](../FLOWS/CHAT.md) — la autoverificación técnica.
- [PAGES/cognition](../PAGES/cognition.md) — el lector del COGNITION-LOG.
- [DATA-MODEL](../DATA-MODEL.md) — "Lo que NO está en la base" (el log es
  archivo).
