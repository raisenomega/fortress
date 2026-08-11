# ADR-024: El estado OMEGA significa "aprobado, esperando firma humana"

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Con el revisor aprobando, la tentación natural es que la propuesta pase
directa a mergearse. Pero la doctrina del motor es una sola: el motor
propone, el humano dispone.

## Alternativas consideradas

- **Auto-merge tras la aprobación del revisor:** descartada — viola la
  doctrina; ningún juicio automático sustituye la firma.
- **Fusionar "aprobado" y "firmado" en un estado:** descartada — borra la
  frontera exacta donde el humano entra; la máquina debe mostrarla.

## Decisión

OMEGA es el estado de "aprobado por el revisor, esperando firma humana".
El estado siguiente (aprobado por el humano) queda reservado al eslabón de
firma. La espera puede ser larga; el estado la hace visible y auditable.

## Consecuencias

### Positivas
- La frontera humano/máquina es un estado explícito de la máquina.

### Negativas
- Propuestas aprobadas pueden acumularse esperando firma (visible a
  propósito).

### Neutras
- La caducidad por avance de la rama principal sigue aplicando en la
  espera.

## Referencias

- ADR-008, ADR-018 · [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md).
