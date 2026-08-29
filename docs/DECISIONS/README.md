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

Los ADRs se agrupan en tres bloques por su origen:

- **ADR-001 a ADR-030** — capítulo del motor de auto-reparación.
- **ADR-031 a ADR-057** — sistema pre-motor (arquitectura, motor de IA,
  agentes de auditoría, grafo, loop autónomo, ciclo de capacidades, génesis y
  doctrina transversal).
- **ADR-058 en adelante** — decisiones contemporáneas: se escriben **antes**
  del cambio que las aplica, según la regla de [CONTRIBUTING](../CONTRIBUTING.md).

Los dos primeros bloques son registro **retroactivo** del 2026-08-11: se
escribieron después de las decisiones que registran. Las fechas de los ADRs
pre-motor son aproximadas (fase del proyecto), consistentes con la línea
temporal. A partir del ADR-058 la fecha del documento es la de la decisión.

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
| [ADR-031](adr-031-ddd-estricto-dependencias-hacia-adentro.md) | DDD estricto con dependencias hacia adentro | 2026-08-01 | Aceptada | Arquitectura |
| [ADR-032](adr-032-reglas-duras-verificadas-por-eslint.md) | Reglas duras verificadas por la máquina | 2026-08-01 | Aceptada | Arquitectura |
| [ADR-033](adr-033-cli-headless-en-vez-del-sdk.md) | Claude Code CLI en vez del SDK | 2026-08-01 | Aceptada | Motor de IA |
| [ADR-034](adr-034-safestorage-para-la-api-key.md) | safeStorage para la API key, nunca al renderer | 2026-08-01 | Aceptada | Seguridad |
| [ADR-035](adr-035-tema-omega-identidad-visual-unica.md) | Tema OMEGA como identidad visual única | 2026-08-03 | Aceptada | UI |
| [ADR-036](adr-036-sqlite-modular-migraciones-aditivas.md) | Persistencia SQLite modular, migraciones aditivas | 2026-08-03 | Aceptada | Persistencia |
| [ADR-037](adr-037-ipc-agregador-central-unico.md) | IPC agregador central único, cero fire-and-forget | 2026-08-03 | Aceptada | IPC |
| [ADR-038](adr-038-aislamiento-estricto-por-proyecto.md) | Aislamiento estricto por proyecto | 2026-08-03 | Aceptada | Arquitectura |
| [ADR-039](adr-039-escaner-score-determinista-push-bloqueado.md) | Escáner con score determinista y push bloqueado por CRITICAL | 2026-08-04 | Aceptada | Escaneo |
| [ADR-040](adr-040-modo-supervisado-autonomo-degradacion.md) | Modo supervisado/autónomo con degradación por petición | 2026-08-04 | Aceptada | Chat |
| [ADR-041](adr-041-autoverificacion-allowlist-minimo.md) | Autoverificación del agente con allowlist mínimo | 2026-08-04 | Aceptada | Chat |
| [ADR-042](adr-042-sin-dependencias-nuevas-sin-justificacion.md) | Sin dependencias nuevas sin justificación | 2026-08-04 | Aceptada | Arquitectura |
| [ADR-043](adr-043-conectores-mcp-cable-vivo-al-spawn.md) | Conectores MCP con cable vivo al spawn | 2026-08-05 | Aceptada | Chat |
| [ADR-044](adr-044-workspace-trust-por-proyecto.md) | Workspace Trust, confianza por proyecto, default false | 2026-08-05 | Aceptada | Seguridad |
| [ADR-045](adr-045-agentes-catalogo-de-datos.md) | Los 11 agentes de auditoría como catálogo de datos | 2026-08-05 | Aceptada | Agentes |
| [ADR-046](adr-046-sentinel-omega-carta-y-noes.md) | Sentinel Omega, su carta y sus "no" deliberados | 2026-08-05 | Aceptada | Agentes |
| [ADR-047](adr-047-dos-bucles-de-aprendizaje.md) | Los dos bucles de aprendizaje | 2026-08-05 | Aceptada | Sistema |
| [ADR-048](adr-048-knowledge-graph-via-mcp.md) | Knowledge Graph vía MCP, grafo primero | 2026-08-06 | Aceptada | Grafo |
| [ADR-049](adr-049-loop-autonomo-pre-motor.md) | Loop autónomo pre-motor | 2026-08-06 | Aceptada | Motor autónomo |
| [ADR-050](adr-050-backlog-auto-mejora.md) | Backlog de auto-mejora con enrutamiento de observaciones | 2026-08-07 | Aceptada | Auto-mejora |
| [ADR-051](adr-051-ciclo-capacidades-dos-ejes.md) | Ciclo de capacidades: fase y madurez como dos ejes | 2026-08-07 | Aceptada | Capacidades |
| [ADR-052](adr-052-gate-por-kind.md) | Gate por kind: reversible avanza, agente exige humano | 2026-08-07 | Aceptada | Capacidades |
| [ADR-053](adr-053-agente-como-dato.md) | Agente-como-dato, no código generado | 2026-08-07 | Aceptada | Capacidades |
| [ADR-054](adr-054-bucle-de-genesis.md) | Bucle de génesis con topes obligatorios | 2026-08-08 | Aceptada | Génesis |
| [ADR-055](adr-055-configuracion-guiada-envelope.md) | Configuración guiada con envelope de documentos de gobierno | 2026-08-06 | Aceptada | Configuración |
| [ADR-056](adr-056-cero-telemetria.md) | Cero telemetría, doctrina contractual | 2026-08-04 | Aceptada | Doctrina |
| [ADR-057](adr-057-puerto-codeagent-frontera-proveedor.md) | Puerto CodeAgent como frontera única con el proveedor | 2026-08-06 | Aceptada | Arquitectura |
| [ADR-058](adr-058-capas-de-exclusion-explicitas.md) | Cada capa de exclusión declara su propia lista | 2026-08-12 | Aceptada | Empaquetado |
| [ADR-059](adr-059-capas-de-estado-no-heredan.md) | Ninguna capa hereda estado de otra por proximidad conceptual | 2026-08-13 | Aceptada | Arquitectura |
| [ADR-060](adr-060-auto-merge-loop.md) | Merge automático bajo política firmada en modo autónomo | 2026-08-13 | Aceptada | Motor autónomo |
| [ADR-061](adr-061-modo-autonomo-con-la-disciplina-del-motor.md) | El modo autónomo repara con la disciplina del motor | 2026-08-16 | Aceptada | Motor autónomo |
| [ADR-062](adr-062-deliberacion-multi-agente-pospuesta.md) | La deliberación entre varios agentes queda pospuesta | 2026-08-16 | Aceptada | Motor autónomo |
| [ADR-063](adr-063-motor-proyecto-activo.md) | El motor sale del repo propio y habla del proyecto activo | 2026-08-16 | Aceptada | Motor |
| [ADR-064](adr-064-corpus-del-proyecto.md) | El corpus del proyecto se descubre, y el prompt calla si no lo hay | 2026-08-17 | Aceptada | Agentes |
| [ADR-065](adr-065-nada-muere-sin-juicio.md) | Ningún hallazgo se extingue por ausencia en un escaneo | 2026-08-23 | Aceptada | Escaneo |
| [ADR-066](adr-066-analisis-ilegible-no-es-obsoleto.md) | Un análisis que no se deja leer no es un hallazgo obsoleto | 2026-08-23 | Aceptada | Motor |
| [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md) | La identidad de un hallazgo es fichero │ tipo │ símbolo | 2026-08-23 | Aceptada | Escaneo |
| [ADR-068](adr-068-tope-mide-trabajo-y-techo-de-turnos.md) | El tope por propuesta mide trabajo, no contexto releído | 2026-08-23 | Aceptada | Motor |
| [ADR-069](adr-069-cerco-mide-el-fichero-antes-de-integrar.md) | El cerco mide el fichero antes de integrarlo | 2026-08-24 | Aceptada | Motor |
| [ADR-070](adr-070-una-autorizacion-no-es-una-denegacion.md) | Una autorización no es una denegación | 2026-08-24 | Aceptada | Motor |
| [ADR-071](adr-071-cuando-dos-filas-son-una.md) | Cuando dos filas son una: la fusión de la Fase B | 2026-08-24 | Aceptada | Escaneo |
| [ADR-072](adr-072-caducado-no-miente.md) | Retirar una propuesta la CADUCA: el estado dice que murió, la razón dice quién | 2026-08-27 | Aceptada | Motor |
| [ADR-073](adr-073-el-freno-en-el-embudo.md) | El freno del reindexado va en el embudo, no en el handler | 2026-08-27 | Aceptada | Grafo |
| [ADR-074](adr-074-el-asiento-no-afirma-mas-de-lo-que-sabe.md) | El asiento no afirma más de lo que sabe: los actos del operador son `info` | 2026-08-27 | Aceptada | Motor |
| [ADR-075](adr-075-el-modal-por-portal.md) | `Modal` se monta en `document.body` por portal, no donde se declara | 2026-08-28 | Aceptada | UI |

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md), [FLOWS/RETRY](../FLOWS/RETRY.md),
  [AGENTS](../AGENTS.md) — los sistemas que estas decisiones construyeron.
- [PRINCIPLES](../PRINCIPLES.md) — varios principios nacieron de estas
  decisiones y sus errores.
