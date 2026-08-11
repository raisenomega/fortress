# ADR-005: Cierre manual del cluster de reparación del loop viejo

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Mientras el motor disciplinado nacía, el loop autónomo pre-motor conservaba
sus propios caminos de arreglo. Dos mecanismos de reparación activos sobre
los mismos hallazgos producirían carreras, dobles fixes y facturas cruzadas.

## Alternativas consideradas

- **Dejarlos convivir:** descartada — carreras y responsabilidad difusa
  sobre qué mecanismo tocó qué.
- **Retiro inmediato del loop completo:** descartada — el loop tiene partes
  (escaneo→verificación) aún útiles; retirarlo entero era prematuro.

## Decisión

El cluster de reparación del loop viejo se cierra A MANO (decisión
explícita, no automatismo), dejando el loop limitado a sus funciones no
conflictivas, con su retiro completo planificado como incremento futuro.

## Consecuencias

### Positivas
- Una sola vía de reparación activa: el motor disciplinado.

### Negativas
- Deuda declarada: el retiro definitivo sigue pendiente.

### Neutras
- El dominio del loop en la superficie IPC quedó reducido a push de estado
  ([IPC](../IPC.md)).

## Referencias

- ADR-003 · [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md).
