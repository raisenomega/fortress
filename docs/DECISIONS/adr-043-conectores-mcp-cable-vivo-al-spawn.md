# ADR-043: Conectores MCP con cable vivo al spawn

**Estado:** Aceptada
**Fecha:** 2026-08-05
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

FORTRESS puede ampliar el poder de sus agentes con conectores MCP
(servidores de herramientas externas, como el grafo de código). Había que
decidir cómo llegan esos conectores al agente: como configuración global
estática, o inyectados en cada corrida.

## Alternativas consideradas

- **Configuración global de MCPs para todos los proyectos:** descartada —
  pierde el aislamiento por proyecto; un conector de un proyecto quedaría
  disponible en todos.
- **Sin conectores MCP:** descartada — el operador quiere poder ampliar lo
  que el agente puede hacer; cerrarlo limita el sistema sin ganancia.

## Decisión

Los conectores son del operador, con un panel para gestionarlos y toggles
por conector. Los que están activos se pasan al spawn del CLI en CADA
corrida — cable vivo, no configuración estática. Un conector nuevo se fija
por versión (nunca "lo último publicado", ADR-042).

## Consecuencias

### Positivas
- El poder del agente es extensible sin tocar código.
- El cable vivo permite cambiar conectores sin reiniciar.

### Negativas
- Cada spawn arma su conjunto de conectores (coste mínimo por corrida).

### Neutras
- Los conectores no cuelgan de un proyecto: borrar uno no apaga un conector.

## Referencias

- [PAGES/conectores](../PAGES/conectores.md) — la vista de gestión.
- [DATA-MODEL](../DATA-MODEL.md) — la tabla de conectores (sin FK a
  proyecto).
- ADR-048 (el grafo de código, el conector MCP central).
