# ADR-038: Aislamiento estricto por proyecto

**Estado:** Aceptada
**Fecha:** 2026-08-03
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

FORTRESS gestiona varios proyectos a la vez. El estado de uno (chat,
hallazgos, escaneos, telemetría, actividad) no puede filtrarse al de otro, y
un agente que actúa sobre un proyecto no debe tocar el filesystem de otro.

## Alternativas consideradas

- **Un workspace compartido para todos los proyectos:** descartada — cruce
  de contexto; el historial y los hallazgos de proyectos distintos se
  mezclarían.
- **Una sesión global sin identificador de proyecto:** descartada — se
  pierde la trazabilidad de qué pasó en qué proyecto.

## Decisión

Todo el estado se ancla por `project_id`: toda tabla del proyecto lo lleva,
toda consulta filtra por él, y borrar un proyecto se lleva lo suyo por
cascada. Cada agente se ejecuta con el `cwd` en la carpeta de SU proyecto.
El estado de la interfaz (streaming, error, medidores) es por proyecto:
correr dos a la vez no los confunde.

## Consecuencias

### Positivas
- Cero cruce de contexto entre proyectos; trazabilidad completa por
  proyecto.
- Quitar un proyecto no deja huérfanos.

### Negativas
- No hay vista "todo junto" a nivel de datos (la cartera es agregación de
  vista, no de estado).

### Neutras
- El aislamiento es la base sobre la que operan los agentes.

## Referencias

- [ARCHITECTURE](../ARCHITECTURE.md) — el aislamiento como garantía.
- [DATA-MODEL](../DATA-MODEL.md) — `project_id` y las cascadas.
- [SECURITY-MODEL](../SECURITY-MODEL.md) — el aislamiento como mitigación.
