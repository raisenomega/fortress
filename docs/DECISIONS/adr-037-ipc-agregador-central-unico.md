# ADR-037: IPC con agregador central único y sin fire-and-forget

**Estado:** Aceptada
**Fecha:** 2026-08-03
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El renderer y el proceso principal se comunican por canales IPC nombrados.
Con decenas de canales, dos riesgos crecen: que un canal exista en un
proceso pero no en el otro (asimetría), y que operaciones "menores" se hagan
fire-and-forget, sin forma de saber si se procesaron.

## Alternativas consideradas

- **Strings literales de canal ad-hoc en cada proceso:** descartada — el
  main y el preload divergen en silencio; un canal renombrado en uno queda
  colgado en el otro.
- **Fire-and-forget para eventos "menores":** descartada — una operación sin
  retorno no deja rastro de si ocurrió; imposible de auditar cuando algo
  falla.

## Decisión

Los nombres de canal viven en un AGREGADOR CENTRAL único, importado por el
main (para registrar handlers) y por el preload (para invocar y suscribir).
La simetría es estructuralmente imposible de romper sin editar el agregador.
Toda operación renderer→main es request/response tipado (invoke/handle) con
Promise: **cero fire-and-forget**. Los push del main al renderer (streaming,
estado) usan un helper tipado que oculta el evento de Electron y devuelve su
des-suscripción.

## Consecuencias

### Positivas
- No puede haber canal en un proceso sin exposición en el otro.
- Toda petición confirma su resultado; una Promise rechazada es señal
  explícita de error.

### Negativas
- Añadir un canal exige tocar el agregador primero (fricción deliberada).

### Neutras
- La superficie de canales es exactamente lo que el preload expone.

## Referencias

- [IPC](../IPC.md) — los 105 canales y la fuente única de nombres.
- [ARCHITECTURE](../ARCHITECTURE.md) — el preload tipado y el aislamiento.
- [SECURITY-MODEL](../SECURITY-MODEL.md) — la superficie IPC como frontera.
