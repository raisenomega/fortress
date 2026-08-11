# ADR-013: Supersede automático de propuestas anteriores

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Sobre un mismo hallazgo pueden acumularse propuestas (una caducó, otra se
rechazó, llega una nueva). Sin una regla, el expediente acumula vías
activas en paralelo y nadie sabe cuál es LA propuesta del hallazgo.

## Alternativas consideradas

- **Bloquear propuestas nuevas mientras exista una vieja:** descartada —
  atasca el flujo con cadáveres; una rechazada no debe vetar el futuro.
- **Permitir propuestas paralelas activas:** descartada — dos fixes del
  mismo hallazgo compiten por el merge; apilamiento sin dueño.

## Decisión

Una propuesta nueva sobre un hallazgo deja OBSOLETAS a las anteriores de
ese hallazgo automáticamente. En cualquier momento hay a lo sumo una vía
activa por hallazgo; lo reemplazado queda como historia y no se reintenta.

## Consecuencias

### Positivas
- Expediente lineal por hallazgo: siempre se sabe cuál es la vigente.

### Negativas
- Una propuesta prometedora puede quedar reemplazada por descuido si se
  re-propone sin querer (mitigado: la elección es determinista).

### Neutras
- El reintento hereda esta regla: su anti-apilamiento emerge de aquí.

## Referencias

- [FLOWS/RETRY](../FLOWS/RETRY.md) — la guarda de reemplazo.
- [GLOSSARY](../GLOSSARY.md) — supersede.
