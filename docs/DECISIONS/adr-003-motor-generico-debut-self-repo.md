# ADR-003: Motor genérico con debut restringido al propio repo

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Con el loop autónomo bloqueado sobre el self-repo (ADR-002), FORTRESS
necesitaba un camino legítimo para reparar su propio código: uno con juicios
automáticos y firma humana. Y todo motor nuevo necesita un terreno de
estreno donde los errores duelan poco y se auditen mucho.

## Alternativas consideradas

- **Motor exclusivo para el self-repo:** descartada — el diseño serviría a
  un solo cliente y habría que generalizarlo después, con retrabajo.
- **Estreno directo sobre proyectos de usuarios:** descartada — un motor
  sin historial no se estrena sobre código ajeno.

## Decisión

El motor de auto-reparación se diseña GENÉRICO (opera sobre cualquier
proyecto registrado), pero su debut se restringe al propio repo de
FORTRESS, donde cada eslabón se audita con evidencia y la firma humana es
obligatoria. La generalización a otros proyectos es decisión posterior.

## Consecuencias

### Positivas
- El diseño no acumuló deuda de generalización.
- El estreno produjo un espécimen auditado de punta a punta.

### Negativas
- Convivencia temporal de dos mecanismos (loop viejo y motor) hasta el
  retiro planificado del primero.

### Neutras
- El botón del motor aparece solo donde el debut lo permite.

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — el flujo completo.
- ADR-002, ADR-007 (el otro eje del debut: severidades).
