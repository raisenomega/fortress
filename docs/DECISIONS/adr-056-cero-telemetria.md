# ADR-056: Cero telemetría, doctrina contractual

**Estado:** Aceptada
**Fecha:** 2026-08-04
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

FORTRESS trabaja con el código y las credenciales del usuario. La confianza
en una herramienta así depende de una promesa clara sobre qué datos salen
del equipo. Cualquier ambigüedad aquí erosiona la razón misma de usarla.

## Alternativas consideradas

- **Telemetría opt-in con un toggle:** descartada — cualquier canal de
  salida es una promesa que puede romperse; existir el canal ya es
  superficie de fuga, aunque esté apagado.
- **Telemetría anónima:** descartada — "anónima" es siempre revocable en la
  práctica; la doctrina exige AUSENCIA estructural, no anonimización.

## Decisión

Cero telemetría, como doctrina: ningún dato del operador sale del disco
local. No hay servidores propios, no hay canal de salida, no hay toggle que
activarla. Las peticiones al modelo salen del proceso principal directo al
proveedor; todo lo demás (hallazgos, scores, historial, cognición) vive en
el equipo.

## Consecuencias

### Positivas
- La promesa es estructural, no configurable: no hay canal que romper.
- La ausencia de un toggle de telemetría en Ajustes es la doctrina en
  acción, visible.

### Negativas
- FORTRESS no recibe datos de uso para mejorar el producto (el precio
  consciente de la confianza).

### Neutras
- El operador que necesite métricas usa herramientas externas propias.

## Referencias

- [SECURITY-MODEL](../SECURITY-MODEL.md) — cero telemetría en el modelo.
- [PRINCIPLES](../PRINCIPLES.md) — la doctrina de datos locales.
- [PAGES/ajustes](../PAGES/ajustes.md) — donde la ausencia del toggle es la
  prueba viva.
