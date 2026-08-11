# ADR-017: Timeouts por comando en el gate

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un comando colgado no puede colgar al motor. Y cuando algo se cuelga, la
autopsia debe decir CUÁL comando fue, no "el gate tardó demasiado".

## Alternativas consideradas

- **Sin timeout:** descartada — un test en bucle infinito congela la cola
  de juicios para siempre.
- **Timeout global único del gate:** descartada — no identifica al
  culpable y castiga a los comandos rápidos por el lento.

## Decisión

Timeout POR COMANDO: 15 minutos para la instalación, 10 minutos para cada
comando de verificación. Al excederse, el proceso se termina por GRUPO
(matar solo al padre deja nietos vivos sosteniendo pipes) y el rechazo
registra qué comando fue.

## Consecuencias

### Positivas
- La cola nunca se congela; la autopsia nombra al culpable.

### Negativas
- Proyectos con suites muy lentas necesitarán ajustar límites (consciente).

### Neutras
- Los valores son parámetros de diseño públicos.

## Referencias

- [PRINCIPLES](../PRINCIPLES.md) — principio 5 (kill de grupo, probado con
  binarios falsos).
- [AGENTS](../AGENTS.md) — el gate.
