# Architecture Decision Records (ADRs)

Esta carpeta contiene las decisiones arquitectónicas firmadas del proyecto,
en formato ADR. Cada ADR es autocontenido: no requiere conocer nomenclatura
interna de planes ni memoria de sesiones para entenderse.

## Formato

- **Estado**: Aceptada / Superada por ADR-X / Deprecada.
- **Fecha**: cuándo se firmó la decisión.
- **Contexto**: por qué se planteó.
- **Alternativas consideradas**: qué se evaluó y por qué se descartó (las
  reconstruidas retroactivamente se marcan como tales).
- **Decisión**: qué se decidió, como acción firmada.
- **Consecuencias**: positivas, negativas, neutras.
- **Referencias**: docs cruzados y ADRs relacionados.

## Numeración

Cronológica por orden de descubrimiento en las sesiones, no por
importancia. **Nunca se re-numera un ADR.** Si una decisión es superada, se
marca "Superada por ADR-X" en su estado; el archivo original permanece.

ADR-001 a ADR-030: capítulo del motor de auto-reparación (registro
retroactivo, 2026-08-11). ADR-031 en adelante: sistema pre-motor (por
completar en una fase posterior).

## Índice

| ADR | Título | Fecha | Estado | Tema |
|---|---|---|---|---|
| [ADR-001](adr-001-score-honesto-por-expediente-active.md) | Score honesto por expediente ACTIVE | 2026-08-07 | Aceptada | Score |
| [ADR-002](adr-002-loop-blindado-redes-independientes.md) | Loop autónomo blindado con redes independientes | 2026-08-07 | Aceptada | Seguridad |
| [ADR-003](adr-003-motor-generico-debut-self-repo.md) | Motor genérico con debut restringido al propio repo | 2026-08-08 | Aceptada | Motor |
| [ADR-004](adr-004-gate-hermetico-en-worktree.md) | Gate hermético en worktree con instalación limpia | 2026-08-08 | Aceptada | Gate |
| [ADR-005](adr-005-cierre-manual-cluster-loop-viejo.md) | Cierre manual del cluster de reparación del loop viejo | 2026-08-08 | Aceptada | Motor |
| [ADR-006](adr-006-merge-no-ff-desde-rama-reparacion.md) | Merge con --no-ff desde la rama de reparación | 2026-08-08 | Aceptada | Firma |
| [ADR-007](adr-007-debut-low-medium.md) | Debut sobre hallazgos LOW y MEDIUM | 2026-08-08 | Aceptada | Motor |
| [ADR-008](adr-008-base-sha-persistido.md) | base_sha persistido como base del worktree | 2026-08-08 | Aceptada | Motor |
| [ADR-009](adr-009-worktrees-en-datos-de-la-app.md) | Worktrees del motor en los datos de la aplicación | 2026-08-08 | Aceptada | Motor |
| [ADR-010](adr-010-rama-reparacion-id-slug.md) | Rama de reparación nombrada por id y slug | 2026-08-08 | Aceptada | Motor |
| [ADR-011](adr-011-generador-propio.md) | Agente generador propio, separado del analista | 2026-08-08 | Aceptada | Agentes |
| [ADR-012](adr-012-correa-allowed-files.md) | Un hallazgo, un fix, con correa de archivos permitidos | 2026-08-08 | Aceptada | Motor |
| [ADR-013](adr-013-supersede-automatico.md) | Supersede automático de propuestas anteriores | 2026-08-08 | Aceptada | Motor |
| [ADR-014](adr-014-presupuesto-duro-por-propuesta.md) | Presupuesto duro de tokens por propuesta | 2026-08-08 | Aceptada | Presupuesto |
| [ADR-015](adr-015-gate-tres-comandos.md) | El gate son los tres comandos del humano | 2026-08-08 | Aceptada | Gate |
| [ADR-016](adr-016-npm-ci-estricto.md) | Instalación estricta sin reuso de node_modules | 2026-08-08 | Aceptada | Gate |
| [ADR-017](adr-017-timeouts-por-comando.md) | Timeouts por comando en el gate | 2026-08-08 | Aceptada | Gate |
| [ADR-018](adr-018-estado-gate-pasado.md) | El estado GATE significa "pasado, esperando revisor" | 2026-08-08 | Aceptada | Estados |
| [ADR-019](adr-019-boton-explicito-gate.md) | Botón explícito para correr el gate | 2026-08-08 | Aceptada | Operación |
| [ADR-020](adr-020-cola-serial-unica-juicios.md) | Cola serial única para los juicios | 2026-08-08 | Aceptada | Operación |
| [ADR-021](adr-021-revisor-propio.md) | Agente revisor propio (claude-omega) | 2026-08-08 | Aceptada | Agentes |
| [ADR-022](adr-022-input-completo-al-revisor.md) | Input completo al revisor | 2026-08-08 | Aceptada | Revisor |
| [ADR-023](adr-023-seis-ejes-veredicto-recomputado.md) | Seis ejes y veredicto global recomputado por el motor | 2026-08-08 | Aceptada | Revisor |
| [ADR-024](adr-024-estado-omega-esperando-firma.md) | El estado OMEGA significa "aprobado, esperando firma humana" | 2026-08-08 | Aceptada | Estados |
| [ADR-025](adr-025-reserva-presupuesto-revisor.md) | Reserva de presupuesto para el revisor | 2026-08-08 | Aceptada | Presupuesto |
| [ADR-026](adr-026-timeout-revisor-15-minutos.md) | Timeout del revisor en 15 minutos | 2026-08-08 | Aceptada | Revisor |
| [ADR-027](adr-027-boton-explicito-revisor.md) | Botón explícito para correr el revisor | 2026-08-08 | Aceptada | Operación |
| [ADR-028](adr-028-reintento-solo-razonamiento.md) | Reintento solo por razones de razonamiento | 2026-08-08 | Aceptada | Reintento |
| [ADR-029](adr-029-reintento-propuesta-nueva.md) | El reintento crea una propuesta nueva con vínculo | 2026-08-08 | Aceptada | Reintento |
| [ADR-030](adr-030-reintento-analisis-fresco.md) | El reintento corre análisis fresco, sin cachear el viejo | 2026-08-08 | Aceptada | Reintento |

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md), [FLOWS/RETRY](../FLOWS/RETRY.md),
  [AGENTS](../AGENTS.md) — los sistemas que estas decisiones construyeron.
- [PRINCIPLES](../PRINCIPLES.md) — varios principios nacieron de estas
  decisiones y sus errores.
