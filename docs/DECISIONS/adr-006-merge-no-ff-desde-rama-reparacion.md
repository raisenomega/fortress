# ADR-006: Merge con --no-ff desde la rama de reparación

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Cuando un fix aprobado se firma, su entrada a la rama principal debe quedar
auditable: dónde empieza, dónde termina, qué propuesta lo produjo.

## Alternativas consideradas

- **Fast-forward:** descartada — disuelve la frontera del incremento; el
  merge deja de ser un evento consultable.
- **Squash:** descartada — pierde la granularidad de los commits del fix y
  rompe la correspondencia con el libro de vida.

## Decisión

El merge de un fix firmado es local, con `--no-ff`, desde la rama de
reparación de la propuesta. La rama se borra tras el merge (su historia
queda en el grafo de commits). El push a origin es siempre del humano.

## Consecuencias

### Positivas
- Cada fix es un evento visible en la historia, correlacionable con su
  propuesta.

### Negativas
- Más commits de merge en la historia (aceptado: son la auditoría).

### Neutras
- La política de borrado de rama es post-merge, no pre.

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la firma humana.
- ADR-010 (el nombre de la rama).
