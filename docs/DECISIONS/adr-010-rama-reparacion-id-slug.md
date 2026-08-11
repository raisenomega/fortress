# ADR-010: Rama de reparación nombrada por id y slug

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Cada propuesta genera su fix en una rama. El nombre de esa rama es la
correlación visible entre el grafo de git y el expediente del motor.

## Alternativas consideradas

- **Rama única reutilizada:** descartada — colisiones entre propuestas y
  pérdida de correlación histórica.
- **Nombre por fecha:** descartada — dos propuestas el mismo día colisionan
  y la fecha no identifica al hallazgo.

## Decisión

La rama se nombra con el prefijo de reparación más el identificador de la
propuesta y un slug legible del hallazgo. Quien mira `git branch` sabe qué
propuesta y qué problema hay detrás sin abrir la aplicación.

## Consecuencias

### Positivas
- Correlación directa git ↔ expediente ↔ libro de vida.

### Negativas
- Nombres largos (aceptado: legibilidad sobre brevedad).

### Neutras
- El slug es cosmético; la clave es el id.

## Referencias

- ADR-006 (el merge desde esta rama).
