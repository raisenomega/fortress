# ADR-029: El reintento crea una propuesta nueva con vínculo

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

¿El reintento reabre la propuesta rechazada o crea otra? Reabrirla
destruiría la historia de por qué se rechazó — y los estados terminales de
la máquina son terminales por diseño.

## Alternativas consideradas

- **Reabrir la propuesta (RECHAZADO → ELEGIDO):** descartada — rompe la
  máquina de estados y borra la autopsia del intento fallido.
- **Propuesta nueva sin vínculo:** descartada — el linaje entre intentos
  se perdería; nadie podría reconstruir la cadena.

## Decisión

Reintentar crea una propuesta NUEVA, anclada al HEAD ACTUAL (no al viejo),
sobre el mismo hallazgo, cuya razón de análisis NACE con el vínculo
textual al identificador de la previa — trazable por consulta desde el
primer instante. La vieja queda inmutable. Las guardas previas (hallazgo
vivo, sin reemplazo posterior) impiden inventar trabajo o apilar intentos;
el linaje queda lineal por construcción.

## Consecuencias

### Positivas
- Historia completa de todos los intentos; terminales intactos.

### Negativas
- Más filas en el expediente por hallazgo conflictivo (es la historia).

### Neutras
- El vínculo sobrevive en la razón incluso tras el análisis fresco.

## Referencias

- [PRINCIPLES](../PRINCIPLES.md) — principio 12.
- [FLOWS/RETRY](../FLOWS/RETRY.md) · ADR-013, ADR-030.
