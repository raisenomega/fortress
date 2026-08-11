# ADR-002: Loop autónomo blindado con redes independientes

**Estado:** Aceptada
**Fecha:** 2026-08-07
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El loop autónomo pre-motor podía, en teoría, operar sobre el código del
propio FORTRESS mientras FORTRESS corría. Reemplazar o mutar el binario vivo
bajo el proceso en ejecución lo crashea, y un fallo a mitad de auto-edición
dejaría la herramienta en estado inconsistente sin camino de recuperación.

## Alternativas consideradas

- **Bloqueo solo en la interfaz (ocultar el botón):** descartada — un
  renderer comprometido o un flujo nuevo lo saltaría.
- **Flag de configuración:** descartada — lo mutable se muta; una regla de
  seguridad estructural no puede vivir en un ajuste.

## Decisión

Un guard de dominio puro decide si el loop está bloqueado para un proyecto
(el self-repo siempre lo está), aplicado por múltiples capas independientes
(dominio, caso de uso, handler, interfaz), cada capa probada por separado
con un caso que solo ella puede atrapar, y verificado en el binario
distribuido, no solo en el código fuente.

## Consecuencias

### Positivas
- Doctrina permanente: los ciclos autónomos jamás tocan el propio FORTRESS.
- Cada capa es testeable de forma aislada (sin falsos verdes).

### Negativas
- La reparación del propio repo exigió construir después un camino
  disciplinado aparte (el motor con firma humana).

### Neutras
- La verificación post-rebuild por identificadores se volvió rutina.

## Referencias

- [SECURITY-MODEL](../SECURITY-MODEL.md) — la clase de mitigación.
- [PRINCIPLES](../PRINCIPLES.md) — principio 3 (defensa por capas) y 8
  (verificación del binario por identificadores).
- ADR-003 (el camino disciplinado que sí puede tocar el self-repo).
