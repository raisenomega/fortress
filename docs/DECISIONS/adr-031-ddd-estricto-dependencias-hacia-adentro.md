# ADR-031: DDD estricto con dependencias hacia adentro

**Estado:** Aceptada
**Fecha:** 2026-08-01
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El PRD original proponía una estructura plana (`electron/` + `src/`) y hablar
con el proveedor de IA directamente desde donde hiciera falta. Un sistema que
crecería hasta tener motor de auto-reparación, escaneo con agentes, ciclo de
capacidades y varias vistas necesitaba una frontera clara entre la lógica de
negocio y los detalles (Electron, React, SQLite, el CLI del agente).

Sin esa frontera, el núcleo quedaría acoplado al framework: imposible de
probar sin levantar Electron, y con la lógica dispersa entre adaptadores.

## Alternativas consideradas

- **Arquitectura MVC clásica:** descartada — acopla el dominio al framework
  de presentación; la lógica de negocio acabaría dependiendo de React o de
  Electron.
- **Clean Architecture sin capas explícitas (solo convención):** descartada
  — sin capas verificables, la disciplina se erosiona; el dominio puro sin
  frontera dura termina importando adaptadores "por comodidad".

## Decisión

Domain-Driven Design en cuatro capas concéntricas con dependencias SIEMPRE
hacia adentro: `domain` (puro, sin Electron/React/SQLite) → `application`
(casos de uso) → `infrastructure` y `presentation` (adaptadores). El dominio
no importa de ninguna otra capa; los detalles se conectan por puertos
(interfaces) que el núcleo define.

## Consecuencias

### Positivas
- El dominio se prueba sin levantar Electron ni SQLite.
- Cambiar un adaptador (proveedor de IA, base de datos) no toca el núcleo.

### Negativas
- Más indirección: los puertos exigen escribir interfaces además de
  implementaciones.

### Neutras
- Impuso la organización de carpetas de todo el proyecto.

## Referencias

- [ARCHITECTURE](../ARCHITECTURE.md) — las cuatro capas en detalle.
- [PRINCIPLES](../PRINCIPLES.md) — la disciplina de método.
- ADR-032 (los límites de tamaño que refuerzan la modularidad).
