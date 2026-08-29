# Modelo de datos

FORTRESS almacena todo su estado operativo en una base SQLite local:
proyectos, hallazgos, propuestas de reparación, el libro de vida del motor,
corridas de agentes, capacidades, escaneos, conectores y el registro eterno
de OMEGA. Un único archivo. La base nunca sale del disco del usuario.

Este documento es referencia exhaustiva: las 19 tablas, con columnas, tipos,
constraints e índices exactos del código. Verificado además por
introspección readonly de una base viva (con el mismo binding better-sqlite3
que usa FORTRESS): esquema declarado == esquema vivo.

## Ubicación

- Linux: `~/.config/fortress-command-center/fortress.db`
- macOS: `~/Library/Application Support/fortress-command-center/fortress.db`
- Windows: `%APPDATA%\fortress-command-center\fortress.db`

Backup: copiar el archivo con FORTRESS cerrado. No hay backup automático.

## Motor

SQLite vía `better-sqlite3` (binding síncrono de Node). Sin ORM: consultas
directas, SIEMPRE parametrizadas.

**El esquema no es un archivo monolítico.** Está modularizado por dominio
funcional, reflejo de la organización DDD del código:

| Archivo | Tablas que declara |
|---|---|
| núcleo (schema base) | projects, chat_messages, settings, findings, self_observations, loop_sessions |
| telemetría | agent_runs, scans, activity, dismissals |
| sistema (del propio FORTRESS) | capabilities, capability_notes, agent_definitions, capability_episodes |
| omega | omega_log |
| calidad | quality_scans |
| reparación | repair_proposals |
| libro de vida | proposal_events |
| conectores | connectors |

Un orquestador de migraciones corre en cada arranque: el esquema base es
idempotente (`CREATE TABLE IF NOT EXISTS`) y las MIGRACIONES ADITIVAS
añaden con `ALTER TABLE` las columnas que falten en bases creadas por
versiones anteriores (verificación por `hasColumn`, nombres siempre
literales). FORTRESS nunca borra columnas ni cambia tipos: una base vieja
siempre abre.

## Diagrama de relaciones

```
 projects (1) --------< findings (N)          [CASCADE]
    |                     '--- dismissals se cruza por fingerprint
    |----< chat_messages (N)                  [CASCADE]
    |----< agent_runs (N)                     [CASCADE]
    |----< scans (N)                          [CASCADE]
    |----< quality_scans (N)                  [sin FK declarada]
    |----< activity (N)                       [CASCADE]
    |----< dismissals (N)                     [CASCADE]
    |----- loop_sessions (0..1)               [CASCADE, PK = project_id]
    |----< repair_proposals (N)               [sin FK declarada]
    |            |
    |            '----< proposal_events (N)   [CASCADE, UNIQUE(proposal,seq)]
    |
    '--- columnas graph_* (proyección del estado del grafo, sin tabla propia)

 Del propio FORTRESS (sin FK a projects, sobreviven al borrado):
   capabilities --< capability_episodes / capability_notes
   capabilities --- agent_definitions (1:1, PK = capability_id)
   omega_log (registro eterno, project_id SIN FK a propósito)
   connectors · settings · self_observations
```

## Convenciones

- **IDs:** TEXT (UUID o identificadores del dominio). Nunca autoincrement.
- **Timestamps — dos convenciones que conviven:** la mayoría de las tablas
  usa TEXT con ISO 8601 (`created_at`, `at`, `first_seen`...); el expediente
  del motor usa INTEGER con epoch en milisegundos (`repair_proposals.
  created_at/updated_at`, `proposal_events.ts`, y en projects los campos
  `graph_indexed_at_ts` y `graph_indexing_started_at`). Al consultar,
  verificar la convención de la tabla.
- **Booleanos:** INTEGER 0/1 (SQLite no tiene bool nativo).
- **JSON:** TEXT con strings serializados (`evidence_json`,
  `recent_scores`); se parsean en la capa de aplicación.
- **CHECK:** solo en columnas creadas con la tabla (SQLite no admite CHECK
  en ALTER); lo migrado se valida en el dominio al leer.

## Tablas

### projects

**Propósito:** cada proyecto registrado, con su score, confianza, estado de
configuración y la proyección del estado del grafo. Es la tabla más migrada
del sistema: acumula estado operativo transversal.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL |
| path | TEXT | NOT NULL UNIQUE |
| stack | TEXT | NOT NULL DEFAULT '' |
| git_remote / git_branch | TEXT | — |
| fortress_score | INTEGER | NOT NULL DEFAULT 0 |
| general_quality | INTEGER | null = sin auditoría integral |
| quality_partial | INTEGER | null = sin dato |
| dim_seguridad / dim_correctitud / dim_tests / dim_mantenibilidad / dim_dependencias / dim_operacion | INTEGER | las 6 dimensiones; null = sin medir |
| last_scan | TEXT | — |
| has_claude / has_graph / has_fortress | INTEGER | NOT NULL DEFAULT 0 |
| graph_nodes / graph_edges | INTEGER | stats del índice del grafo |
| graph_indexed_at | TEXT | — |
| trusted | INTEGER | NOT NULL DEFAULT 0 (lado seguro) |
| loop_enabled | INTEGER | NOT NULL DEFAULT 0 |
| config_state | TEXT | NOT NULL DEFAULT 'CONFIGURADO' |
| contaminated_at / contamination_detail | TEXT | circuit breaker: auditoría que dejó el proyecto sucio |
| graph_indexed_at_sha | TEXT | SHA que el índice del grafo vio |
| graph_indexed_at_ts | INTEGER | epoch ms |
| graph_indexing_status | TEXT | NOT NULL DEFAULT 'IDLE' (IDLE/RUNNING/ERROR) |
| graph_indexing_started_at | INTEGER | epoch ms |
| graph_indexing_error | TEXT | último error del reindex |
| created_at | TEXT | NOT NULL |

**Índices:** ninguno adicional (PK y UNIQUE de path).

**Migraciones aditivas aplicadas** (para bases anteriores; una base nueva
nace con todo), agrupadas por dominio funcional:

- Confianza y ciclo de vida: `trusted`, `loop_enabled`, `config_state`.
- Calidad integral: `general_quality`, `quality_partial`, las 6 `dim_*`.
- Stats del grafo: `graph_nodes`, `graph_edges`, `graph_indexed_at`.
- Estado del reindex del grafo (5): `graph_indexed_at_sha`,
  `graph_indexed_at_ts`, `graph_indexing_status`,
  `graph_indexing_started_at`, `graph_indexing_error`.
- Circuit breaker (2): `contaminated_at`, `contamination_detail`. Las escribe
  una auditoría que dejó el árbol alterado, y **se limpian juntas** cuando el
  operador desbloquea el proyecto (`markClean`): `contaminated` nace de que la
  fecha sea NULL, pero el detalle forense viaja a la interfaz por su cuenta, y
  dejarlo atrás daría un proyecto ya no contaminado que sigue contando por qué
  lo estuvo. Ver [SECURITY-MODEL](SECURITY-MODEL.md).

**Repositorio principal:** sqlite-project-repository. **Nota:** las
columnas `graph_*` del reindex las opera un repositorio auxiliar dedicado
(sqlite-graph-state-repository) — el estado del grafo tiene ciclo propio
pero no entidad separada; se proyecta como columnas del padre. Ver
[FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md).

### settings

**Propósito:** pares clave-valor del operador (configuración global).

| Columna | Tipo | Constraints |
|---|---|---|
| key | TEXT | PRIMARY KEY |
| value | TEXT | NOT NULL |

**Repositorio principal:** sqlite-settings-repository (con lista blanca de
claves).

### findings

**Propósito:** el expediente de hallazgos por proyecto, con identidad
estable y ciclo de vida (memoria conservadora: los hallazgos no se borran,
y solo se extinguen cuando un agente los juzga).

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK projects ON DELETE CASCADE |
| severity | TEXT | NOT NULL CHECK IN ('CRITICAL','HIGH','MEDIUM','LOW') |
| title | TEXT | NOT NULL |
| file | TEXT | NOT NULL DEFAULT '' |
| line | INTEGER | — |
| fingerprint | TEXT | NOT NULL DEFAULT '' |
| identity | TEXT | NOT NULL DEFAULT '' (clave estable: fichero\|tipo\|símbolo) |
| tipo | TEXT | NOT NULL DEFAULT 'otro' (vocabulario cerrado) |
| simbolo | TEXT | NOT NULL DEFAULT '' (la función que contiene el defecto) |
| status | TEXT | NOT NULL DEFAULT 'open' |
| lifecycle | TEXT | NOT NULL DEFAULT 'ACTIVE' (ACTIVE/MITIGATED/EXTINCT) |
| scan_id | TEXT | escaneo que lo vio por última vez |
| first_seen / last_seen | TEXT | NOT NULL DEFAULT '' (ISO) |
| resolved_at | TEXT | fecha de extinción; null si vivo — y también si fue absorbida por fusión |
| extinct_reason | TEXT | por qué murió, o con quién se fusionó; null si vivo |
| created_at | TEXT | NOT NULL |

**Índices:** idx_findings_project (project_id).

**Migraciones aditivas aplicadas — el paquete de extinción honesta:** la
versión original solo guardaba el hallazgo del último escaneo. El cambio de
esquema para la memoria conservadora del ciclo de vida añadió `fingerprint`,
`status`, `scan_id` y después `identity`, `lifecycle`, `first_seen`,
`last_seen`, `resolved_at` — con BACKFILL de las filas existentes: la clave
estable se calcula y las fechas salen del `created_at` original (no se
inventa una fecha reciente que haría parecer nuevo algo viejo). Después
llegaron `extinct_reason` (por qué murió) y `tipo` / `simbolo` (las dos
piezas de la identidad estable). Las columnas migradas van sin CHECK (SQLite
no lo admite en ALTER); valida el dominio al leer.

**Un hallazgo solo pasa a EXTINCT cuando un agente lo juzga** — el escaneo no
extingue por ausencia. Ver
[ADR-065](DECISIONS/adr-065-nada-muere-sin-juicio.md).

**Una fila ABSORBIDA por fusión es el otro camino a EXTINCT**, y no es una
muerte: dos filas resultaron ser el mismo defecto y una absorbió a la otra. Se
reconoce por sus cuatro marcas juntas, que solo tienen sentido como conjunto:

| marca | valor | qué dice |
|---|---|---|
| `lifecycle` | `EXTINCT` | sale del tablero y de los conteos, como cualquier extinta |
| `extinct_reason` | `fusionada-con-<id de la ganadora>` | con quién se fusionó, y que no fue un juicio |
| `resolved_at` | **NULL** | **no se resolvió**. Una extinción normal escribe aquí su fecha; ponerla aquí afirmaría algo que no pasó |
| `identity` | `fusionada:<id de la ganadora>\|<identidad vieja>` | su clave retirada de circulación, con la traza dentro |

El `resolved_at` en NULL es la diferencia que hay que mirar: distingue una fila
absorbida de una extinta con juicio. Las dos están en `EXTINCT`, pero solo una
tiene fecha de resolución.

**Por qué la identidad se retira con un centinela y no se vacía.** La consulta
que busca la fila de un hallazgo no filtra por ciclo de vida, así que una
absorbida que conservara la clave de la ganadora podría salir elegida en el
escaneo siguiente y volver a `ACTIVE`. Y vaciarla tampoco vale: la migración de
memoria rellena precisamente las filas con `identity = ''`, y se la
recalcularía sola en el arranque siguiente. El centinela no colisiona con
ninguna clave real y deja escrito con quién se fusionó.

La ganadora es la de `first_seen` más antiguo y **conserva su fecha**: es la
historia real del defecto. Ver
[ADR-071](DECISIONS/adr-071-cuando-dos-filas-son-una.md).

**Repositorio principal:** sqlite-finding-repository.

### Las TRES identidades de un hallazgo, y por qué no son una

Se parecen y responden a preguntas distintas. Confundirlas costó filas
duplicadas y una renumeración evitada del historial:

| función | fórmula | para qué |
|---|---|---|
| `findingIdentity` | fichero \| tipo \| símbolo | **la fila de la base**: decide si esto es nuevo o algo que ya existía |
| `patternId` | severidad \| fichero \| título | **el `PTN-` del COGNITION-LOG**. Congelado sobre la fórmula vieja: el log solo persiste severidad y título, así que la clave nueva le sería inservible, y cambiarla dejaría huérfana cada entrada escrita |
| `fingerprintOf` | severidad \| fichero \| línea \| título | **los descartes del operador**. Estricta a propósito: un descarte no debe heredarse a otro problema de la misma zona |

`findingIdentity` y `patternId` compartieron fórmula por comodidad hasta el
2026-08-23. Ver [ADR-067](DECISIONS/adr-067-identidad-fichero-tipo-simbolo.md).

**Conviven dos generaciones de `identity` en la base.** El cambio de fórmula
aplicó hacia adelante, así que las filas anteriores conservaron la vieja
—`severidad │ fichero │ título`— y las dos poblaciones no pueden empatar nunca:
el mismo defecto abría fila nueva junto a la que ya tenía. Las de **este
repositorio** se reconciliaron el 2026-08-24 con una pasada que les asignó tipo
y símbolo y fusionó los duplicados
([ADR-071](DECISIONS/adr-071-cuando-dos-filas-son-una.md)). Las de **otros
proyectos siguen con la fórmula vieja**: reclasificarlas no sirve de nada hasta
que se los vuelva a escanear, y ese fue el alcance decidido. Se reconocen porque
su `identity` empieza por la severidad en mayúsculas.

### dismissals

**Propósito:** descartes del operador que SOBREVIVEN a los escaneos: las
filas de findings se sustituyen en cada escaneo, así que la decisión humana
de descartar vive aparte, cruzada por fingerprint.

| Columna | Tipo | Constraints |
|---|---|---|
| project_id | TEXT | NOT NULL, FK projects ON DELETE CASCADE |
| fingerprint | TEXT | NOT NULL |
| at | TEXT | NOT NULL |
| — | — | PRIMARY KEY (project_id, fingerprint) |

**Repositorio:** gestionada desde sqlite-finding-repository. No tiene repo
propio porque el descarte es una operación del ciclo de vida del hallazgo,
no una entidad independiente.

### scans

**Propósito:** historial de escaneos de SEGURIDAD (score, conteos,
duración). No confundir con quality_scans.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK projects ON DELETE CASCADE |
| score | INTEGER | NOT NULL |
| finding_count / critical_count | INTEGER | NOT NULL DEFAULT 0 |
| duration_ms | INTEGER | NOT NULL DEFAULT 0 |
| at | TEXT | NOT NULL |

**Índices:** idx_scans_project (project_id, at).
**Repositorio principal:** sqlite-scan-history-repository.

### quality_scans

**Propósito:** historial de auditorías de CALIDAD INTEGRAL (las 6
dimensiones), para graficar tendencia. Coexiste con scans a propósito: son
dominios distintos (el escáner de seguridad es anterior; el score integral
vino después). No fusionar.

| Columna | Tipo | Constraints |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL (sin FK declarada) |
| global / partial | INTEGER | NOT NULL |
| dim_seguridad / dim_correctitud / dim_tests / dim_mantenibilidad / dim_dependencias / dim_operacion | INTEGER | null = dimensión sin medir |
| at | TEXT | NOT NULL |

**Índices:** idx_quality_scans_project (project_id, at).
**Repositorio principal:** sqlite-quality-history-repository.

### chat_messages

**Propósito:** historial de chat por proyecto.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK projects ON DELETE CASCADE |
| role | TEXT | NOT NULL |
| content | TEXT | NOT NULL |
| agent_id | TEXT | — |
| mode | TEXT | NOT NULL |
| engine | TEXT | NOT NULL DEFAULT 'api' (migrada) |
| created_at | TEXT | NOT NULL |

**Índices:** idx_chat_project (project_id, created_at).
**Repositorio principal:** sqlite-chat-repository.

### activity

**Propósito:** feed de actividad por proyecto (qué hizo cada agente, con
severidad y ubicación cuando aplica).

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK projects ON DELETE CASCADE |
| agent_id | TEXT | — |
| kind | TEXT | NOT NULL |
| summary | TEXT | NOT NULL |
| severity | TEXT | — |
| file | TEXT | NOT NULL DEFAULT '' |
| line | INTEGER | — |
| at | TEXT | NOT NULL |

**Índices:** idx_activity_project (project_id, at) · idx_activity_agent
(agent_id, at).
**Repositorio principal:** sqlite-activity-repository.

### repair_proposals

**Propósito:** el expediente del motor de auto-reparación — una fila por
propuesta, con su ancla de reproducibilidad y su estado en la máquina (ver
[FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md)).

| Columna | Tipo | Constraints |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL (sin FK declarada) |
| finding_id | TEXT | NOT NULL |
| base_sha | TEXT | NOT NULL (HEAD anclado al nacer) |
| state | TEXT | NOT NULL (la máquina de estados) |
| analysis_verdict | TEXT | REAL / OBSOLETO, null antes del análisis |
| analysis_reason | TEXT | razón; en reintentos nace con `retry_of=...` |
| created_at / updated_at | INTEGER | NOT NULL, epoch ms |

**Índices:** idx_repair_proposals_unica UNIQUE (project_id, finding_id,
created_at) — impide duplicados exactos · idx_repair_proposals_estado
(project_id, state).
**Repositorio principal:** sqlite-repair-proposal-repository.

**Los tres estados terminales, y qué los distingue.** `MERGEADO` es la única
salida buena. `RECHAZADO` lo escribe el juicio de una **máquina** —el gate en
rojo, el revisor con veto, el generador fuera de correa—. `CADUCADO` es lo que
el dominio llama *la salida de emergencia de todos los vivos*: la base se movió,
el análisis quedó obsoleto, el worktree desapareció… **o el operador la retiró**.

En ese último caso la fila queda `CADUCADO` con `analysis_reason` empezando por
`retirada por el operador:` y el motivo que escribiera. El estado dice que
murió; la razón dice quién. No se usó `RECHAZADO` a propósito: mentiría sobre
quién juzgó, y además dejaría el hallazgo bloqueado para la cola. Ver
[ADR-072](DECISIONS/adr-072-caducado-no-miente.md).

La fila se actualiza, pero su historia no se pisa: cada transición **anexa** su
eslabón en `proposal_events`, incluida la de cierre.

### proposal_events

**Propósito:** el libro de vida — cadena append-only por propuesta, un
evento por eslabón, con coste y evidencia.

| Columna | Tipo | Constraints |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| proposal_id | TEXT | NOT NULL, FK repair_proposals ON DELETE CASCADE |
| seq | INTEGER | NOT NULL; UNIQUE (proposal_id, seq) — monotonía |
| phase | TEXT | NOT NULL (SELECT/ANALYZE/GENERATE/GATE/OMEGA/...) |
| event_type | TEXT | NOT NULL (TRANSITION/AGENT_RUN/DECISION/ERROR) |
| from_state / to_state | TEXT | — |
| actor | TEXT | NOT NULL (motor/claude-analyst/claude-generator/gate/omega/human) |
| agent_run_id | TEXT | — |
| scan_id | TEXT | — |
| reason | TEXT | — |
| cost_tokens / duration_ms | INTEGER | — |
| evidence_json | TEXT | JSON serializado |
| ts | INTEGER | NOT NULL, epoch ms |

**Índices:** idx_pe_proposal (proposal_id, seq) · idx_pe_agent_run
(agent_run_id).
**Repositorio principal:** sqlite-proposal-event-repository (tras el puerto
proposal-event-log).

### agent_runs

**Propósito:** telemetría de corridas de agentes de chat y escaneo (coste
real por corrida). Borrar un proyecto se lleva su telemetría.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK projects ON DELETE CASCADE |
| agent_id | TEXT | — |
| kind | TEXT | NOT NULL CHECK IN ('chat','scan') |
| duration_ms | INTEGER | NOT NULL DEFAULT 0 |
| failed | INTEGER | NOT NULL DEFAULT 0 |
| input_tokens / output_tokens / cache_read_tokens / cache_creation_tokens | INTEGER | NOT NULL DEFAULT 0 |
| cost_usd | REAL | NOT NULL DEFAULT 0 |
| num_turns / edits | INTEGER | NOT NULL DEFAULT 0 |
| tools | TEXT | NOT NULL DEFAULT '' |
| at | TEXT | NOT NULL |

**Índices:** idx_runs_project (project_id, at) · idx_runs_agent (agent_id,
at).
**Repositorio principal:** sqlite-agent-run-repository.

### agent_definitions

**Propósito:** definiciones de agentes auto-creados (datos, no código): el
prompt y el icono de un agente nacido del ciclo de capacidades, inyectable
en el chat, reversible con su toggle.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| capability_id | TEXT | PRIMARY KEY (1:1 con su capacidad) |
| name | TEXT | NOT NULL |
| prompt | TEXT | NOT NULL |
| icon_name | TEXT | NOT NULL (nombre semántico del dominio) |
| active | INTEGER | NOT NULL DEFAULT 0 |
| created_at | TEXT | NOT NULL |

**Repositorio principal:** sqlite-agent-draft-repository — el nombre
conserva el término histórico "draft" (el flujo nació como borradores de
agente); en referencias viejas del código puede aparecer como agent_draft.

### capabilities

**Propósito:** capacidades que FORTRESS se propone crearse (función,
herramienta o agente), con su fase APROBADA persistida.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| kind | TEXT | NOT NULL |
| name | TEXT | NOT NULL |
| origin_observation | TEXT | NOT NULL (la observación que la originó) |
| phase | TEXT | NOT NULL DEFAULT 'propuesta' (migrada con ese default: nada asciende solo) |
| created_at | TEXT | NOT NULL |

**Repositorio principal:** sqlite-capability-repository.

### capability_episodes

**Propósito:** episodios reales (una ejecución = un episodio), la unidad de
evidencia de madurez de una capacidad.

| Columna | Tipo | Constraints |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| capability_id | TEXT | NOT NULL |
| outcome | TEXT | NOT NULL |
| summary | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL |

**Índices:** idx_cap_episodes (capability_id, created_at).
**Repositorio principal:** sqlite-capability-episode-repository.

### capability_notes

**Propósito:** notas de refuerzo que agentes u operador dejan hacia una
capacidad (seed de refuerzo: observa, no ejecuta).

| Columna | Tipo | Constraints |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| capability_id | TEXT | NOT NULL |
| author | TEXT | NOT NULL |
| note | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL |

**Índices:** idx_cap_notes (capability_id, created_at).
**Repositorio principal:** sqlite-capability-note-repository.

### loop_sessions

**Propósito:** estado del loop autónomo por proyecto (una sesión por
proyecto: la PK es el proyecto).

| Columna | Tipo | Constraints / Default |
|---|---|---|
| project_id | TEXT | PRIMARY KEY, FK projects ON DELETE CASCADE |
| active | INTEGER | NOT NULL DEFAULT 0 |
| cycles_done | INTEGER | NOT NULL DEFAULT 0 |
| recent_scores | TEXT | NOT NULL DEFAULT '[]' (JSON) |
| spent_baseline | REAL | NOT NULL DEFAULT 0 |
| updated_at | TEXT | NOT NULL |

**Repositorio principal:** sqlite-loop-session-repository.

### self_observations

**Propósito:** el backlog de auto-mejora — lo que un agente descubre de
FORTRESS mismo mientras trabaja en otro proyecto.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| source_project | TEXT | NOT NULL (dónde se observó) |
| kind | TEXT | NOT NULL (bug/gap/limitación/...) |
| area | TEXT | NOT NULL |
| note | TEXT | NOT NULL |
| resolved | INTEGER | NOT NULL DEFAULT 0 |
| created_at | TEXT | NOT NULL |

**Repositorio principal:** sqlite-self-observation-repository.

### connectors

**Propósito:** conectores MCP del OPERADOR (no de un proyecto: borrar un
proyecto no debe apagarle un conector). Sin FK a propósito.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL |
| url | TEXT | NOT NULL DEFAULT '' |
| description | TEXT | NOT NULL DEFAULT '' |
| category | TEXT | NOT NULL |
| enabled | INTEGER | NOT NULL DEFAULT 0 |
| builtin | INTEGER | NOT NULL DEFAULT 0 |
| created_at | TEXT | NOT NULL |

**Índices:** idx_connectors_enabled (enabled).
**Repositorio principal:** sqlite-connector-repository.

### omega_log

**Propósito:** el Libro de la Vida de OMEGA — registro forense append-only.
SIN clave foránea a projects A PROPÓSITO: el asiento SOBREVIVE al proyecto
(la ley del registro eterno). Borrar un proyecto se lleva su chat y sus
hallazgos por cascada, pero nunca su historia aquí.

| Columna | Tipo | Constraints / Default |
|---|---|---|
| id | TEXT | PRIMARY KEY |
| at | TEXT | NOT NULL |
| project_id | TEXT | — (sin FK, deliberado) |
| agent_id | TEXT | — |
| kind | TEXT | NOT NULL |
| verdict | TEXT | NOT NULL |
| summary | TEXT | NOT NULL |
| evidence | TEXT | NOT NULL DEFAULT '' |

**Índices:** idx_omega_project (project_id, at).
**Repositorio principal:** sqlite-omega-log.

## Trazabilidad y consultas comunes

Método de verificación de este documento, reutilizable por futuros
documentadores: introspección readonly desde el runtime de FORTRESS —

```js
const db = require('better-sqlite3')(RUTA_DB, { readonly: true })
db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
```

Consultas de diagnóstico (local; la base nunca sale del equipo):

```sql
-- Últimas 20 propuestas del motor
SELECT id, finding_id, state, updated_at FROM repair_proposals
ORDER BY updated_at DESC LIMIT 20;

-- Libro de vida completo de una propuesta
SELECT seq, phase, event_type, actor, cost_tokens, duration_ms, ts
FROM proposal_events WHERE proposal_id = ? ORDER BY seq;

-- Coste por agente en corridas de chat/escaneo
SELECT agent_id, COUNT(*) runs, SUM(input_tokens + output_tokens) tokens
FROM agent_runs GROUP BY agent_id ORDER BY tokens DESC;

-- Hallazgos vivos por proyecto
SELECT severity, COUNT(*) FROM findings
WHERE project_id = ? AND status = 'open' AND lifecycle != 'EXTINCT'
GROUP BY severity;
```

## Lo que NO está en la base

- El código de los proyectos: vive en el filesystem del usuario.
- La API key: cifrada por el mecanismo del sistema operativo (safeStorage),
  no en la base.
- Los prompts base de los agentes del motor: en el código fuente.
- COGNITION-LOG.md: en el filesystem de cada proyecto.
- El índice del grafo: en la base propia del binario del grafo; en esta
  base solo vive su PROYECCIÓN (columnas `graph_*` de projects).

## Referencias

- [ARCHITECTURE](ARCHITECTURE.md) — la capa de persistencia y sus reglas.
- [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md) — quién escribe
  repair_proposals y proposal_events.
- [FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md) — quién opera las columnas
  graph_* de projects.
- [GLOSSARY](GLOSSARY.md) — términos.
- `docs/IPC.md` — los canales que leen y escriben estas tablas.
