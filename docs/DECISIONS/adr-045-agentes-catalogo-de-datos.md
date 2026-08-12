# ADR-045: Los 11 agentes de auditoría como catálogo de datos con carta compartida

**Estado:** Aceptada
**Fecha:** 2026-08-05
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

FORTRESS despacha agentes especializados de auditoría (seguridad, bugs,
refactor, tests, etc.). Había que decidir cómo se definen: cada uno con su
propio prompt y su propio archivo de configuración, o como datos en un
catálogo con un generador común.

## Alternativas consideradas

- **Un prompt individual redactado por agente:** descartada — divergencia
  peligrosa; un mantenedor podría ajustar el revisor de seguridad con menos
  exigencia de evidencia y quedarían dos estándares distintos en el mismo
  sistema.
- **Agentes hardcodeados en el código:** descartada — no extensible; añadir
  o ajustar un agente exigiría tocar lógica en vez de datos.

## Decisión

Los agentes son un CATÁLOGO DE DATOS: cada uno es una entrada (identificador,
icono semántico, nombre, propósito, activo por defecto, y opcionalmente una
carta propia). Diez de los once derivan su prompt de su nombre y propósito
más una CARTA COMPARTIDA (evidencia obligatoria archivo:línea, no inventar
problemas, no tocar zonas críticas sin explicar impacto). La identidad que
el operador ve en la barra lateral y la que el agente recibe son la MISMA por
construcción.

## Consecuencias

### Positivas
- Un solo estándar de conducta para todos; la identidad no puede divergir
  entre sidebar y prompt.

### Negativas
- Un agente que necesite una identidad muy distinta requiere carta propia
  (la excepción, ADR-046).

### Neutras
- Los agentes auto-creados son otra categoría (datos en la base, ADR-053).

## Referencias

- [AGENTS](../AGENTS.md) — la Familia 2 y la carta compartida.
- [FLOWS/SCAN](../FLOWS/SCAN.md) — el despacho por toggles.
- ADR-046 (Sentinel Omega, la excepción con carta propia).
