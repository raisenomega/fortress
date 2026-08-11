# ADR-027: Botón explícito para correr el revisor

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Mismo dilema que con el gate (ADR-019), con un agravante: el revisor gasta
tokens de modelo, no solo minutos de máquina.

## Alternativas consideradas

- **Encadenar gate verde → revisor automático:** descartada para el debut
  — el gasto de modelo quedaría fuera del acto consciente del operador.
- **Revisar en lote (varias propuestas de una vez):** descartada
  (reconstruida retroactivamente) — mezcla facturas y diluye la atención
  del juicio por caso.

## Decisión

El revisor se dispara con botón explícito por propuesta, visible solo en
el estado correcto. El operador decide cuándo gastar el juicio semántico.

## Consecuencias

### Positivas
- Cada gasto de modelo del juicio es un acto deliberado y auditado.

### Negativas
- Un clic más por propuesta (aceptado en el debut).

### Neutras
- Igual que con el gate, el encadenado futuro no relajaría redes.

## Referencias

- ADR-019, ADR-021.
