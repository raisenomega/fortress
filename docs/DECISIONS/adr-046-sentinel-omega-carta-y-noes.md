# ADR-046: Sentinel Omega — el 11º agente, su carta y sus "no" deliberados

**Estado:** Aceptada
**Fecha:** 2026-08-05
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Los diez agentes de auditoría reportan hallazgos, pero ¿quién los verifica
contra la realidad? Un sistema que se cree sus propios informes no tiene
conciencia crítica. Hacía falta un meta-auditor — y decidir qué puede y qué
NO puede hacer, porque lo que se le rehúsa es tan importante como lo que se
le da.

## Alternativas consideradas

- **Sin meta-auditor:** descartada — nadie verificaría los informes de los
  agentes contra el filesystem; los hallazgos serían fe, no evidencia.
- **Meta-auditor sin poder de veto:** descartada — evidencia sin poder de
  freno es solo un informe más; para proteger el push hace falta que pueda
  bloquear.

## Decisión

Sentinel Omega, el 11º agente, meta-auditor con una carta de cuatro pilares:
testigo-no-actor (observa y veta, nunca ejecuta ni promueve), evidencia-o-
silencio (cada afirmación con archivo:línea; sin prueba, silencio),
discrepancia-no-intención (reporta lo que difiere de la realidad, jamás el
motivo), falible-por-diseño (sus juicios se re-ejecutan; su registro es
append-only). Y grafo-primero como regla no negociable. Se REHUSARON a
propósito funciones que lo harían violar lo que vigila: un toggle que
miente, el pensamiento inferido, el veredicto infalible.

**"OMEGA solo puede FRENAR; quien promueve es el gate por riesgo."**

## Consecuencias

### Positivas
- Verificación independiente contra el filesystem; el veto protege el push
  con evidencia.

### Negativas
- Sin datos, OMEGA calla (no aprueba): a veces la promoción espera
  evidencia que aún no existe.

### Neutras
- No confundir con el revisor del motor (claude-omega): dominios distintos.

## Referencias

- [AGENTS](../AGENTS.md) — Sentinel Omega en detalle y la distinción con
  claude-omega.
- [FLOWS/SCAN](../FLOWS/SCAN.md) — su rol post-escaneo.
- [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md) — el veto que solo frena.
