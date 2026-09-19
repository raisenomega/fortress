# FORTRESS — funcionamiento real a `main@f2cc7f8`

**Fecha del recorrido:** 2026-09-07, **ampliado el 2026-09-19** · **Commit de
referencia:** `f2cc7f8` (2026-09-19)

> ### ⚠ ACTUALIZACIÓN — 2026-09-19: lo que el cuerpo de abajo NO conoce
>
> **Las secciones 1 a 9 se escribieron sobre `main@0cc862b` (2026-09-06).** Entre
> aquel commit y este hay **239 commits, 115 en `src/`, 843 ficheros y 19 ADRs
> nuevos**. Lo que aquellas secciones describen del Terminal **ya no es todo lo
> que hace**: entre el 17 y el 19 de septiembre aprendió a juzgarse solo.
>
> **La §10 es nueva y manda sobre el resto en lo que toca al Terminal.** Nada de
> lo viejo se borra —describe capas que siguen en pie—, pero donde las dos se
> contradigan sobre el Terminal, vale la §10.
**Método:** lectura del código de `src/` por capas (`domain` → `application` → `infrastructure` → `presentation`) y de los 78 ADRs de `docs/DECISIONS/`. Cada afirmación lleva `fichero:línea`. Lo que no se pudo respaldar con código no está escrito.

> **Aviso sobre las plantillas de la raíz.** El `CLAUDE.md` que vive un nivel por encima del repositorio (`../CLAUDE.md`) se describe a sí mismo como *"Configuración Universal para Claude Code · Aplicable a cualquier proyecto"*: es un **molde que FORTRESS distribuye a los proyectos que audita**, igual que la carpeta `templates/**`, que `electron-builder.yml` excluye del binario con el comentario *"Kit universal: se distribuye a proyectos, no viaja en el binario"*. **No describen la maquinaria de FORTRESS.** Lo que la describe es `src/` y `docs/DECISIONS/`, y este documento se apoya solo en eso.

---

## Índice

1. [Qué es FORTRESS](#1-qué-es-fortress)
2. [Los caminos de entrada](#2-los-caminos-de-entrada)
3. [El ciclo de vida de un hallazgo](#3-el-ciclo-de-vida-de-un-hallazgo)
4. [El motor de reparación y la firma](#4-el-motor-de-reparación-y-la-firma)
5. [Código propio vs código ajeno](#5-código-propio-vs-código-ajeno)
6. [Los 11 agentes](#6-los-11-agentes)
7. [OMEGA / Sentinel](#7-omega--sentinel)
8. [La auto-mejora](#8-la-auto-mejora)
9. [Alcance y límites actuales](#9-alcance-y-límites-actuales)
10. [El Terminal autónomo: el juicio antes del código](#10-el-terminal-autónomo-el-juicio-antes-del-código) — **2026-09-19**
11. [Glosario](#11-glosario)

---

## 1. Qué es FORTRESS

FORTRESS Command Center es una aplicación de escritorio Electron (`electron-builder.yml`: `productName: 'FORTRESS. by Raisen'`, `appId: com.fortress.command-center`) que **audita proyectos de código con agentes de IA y repara hallazgos bajo firma humana**. No habla con la API de Anthropic para trabajar sobre código: lanza el CLI de Claude Code como proceso hijo con `cwd` en la carpeta del proyecto (`src/infrastructure/claude-code/claude-code-agent.ts:29-33`, `claude-cli.ts:12-15`; ADR-033). La API solo se usa para un chat de solo texto cuando el CLI no está instalado (`src/application/chat/choose-engine.ts:22-27`).

Lo que hace hoy, en concreto:

- **Escanea** un proyecto con el agente Security Reviewer en modo solo-lectura y guarda los hallazgos en SQLite local (§2.1).
- **Responde** en un Terminal que enruta la petición a un workflow de agentes o conversa (§2.2).
- **Repara** hallazgos con un motor disciplinado —elegir, entender, generar en un worktree aislado, gate mecánico, revisor semántico— y deja el fix **esperando firma humana**; la firma es lo único que integra al árbol vivo (§4).
- **Corre un bucle autónomo** por proyecto, con topes duros de gasto y de propuestas, que sobre código ajeno puede integrar solo bajo una política opt-in y sobre su propio código nunca (§2.3, §5).
- **Se observa a sí misma**: los agentes anotan límites de FORTRESS mientras trabajan en otros proyectos, y ese backlog se exporta, se trabaja fuera y se reimporta (§8).

La persistencia es una base SQLite en `userData` (`src/infrastructure/persistence/database.ts:18-21`) con 19 tablas (`schema*.ts`) y migraciones aditivas (ADR-036). Las capas son DDD estrictas con dependencias hacia adentro (ADR-031): 282 ficheros en `domain`, 159 en `application`, 276 en `infrastructure`, 340 en `presentation` (sin contar tests). Dos reglas duras las verifica ESLint, no una convención: **máximo 75 líneas por fichero y 50 por función**, y `any` prohibido (`eslint.config.mjs:31-34`).

---

## 2. Los caminos de entrada

Todo entra por canales IPC registrados en un único agregador (`src/infrastructure/ipc/channels.ts:10`; ADR-037). Los cinco que importan son estos.

### 2.1 Escanear seguridad

**Disparo:** `IPC.scanRun` (`scan-handlers.ts:52`), desde el botón de la página de Escaneo (`ScanActions.tsx:36`).

**Antes de gastar:** `guardRun` (`scan-handlers.ts:33`) comprueba tres cosas y reserva el turno del proyecto en la misma operación (`src/infrastructure/run-guard.ts:21-29`): que el proyecto no esté **contaminado** (circuit breaker), que no se haya alcanzado el **tope diario**, y que **no haya otra corrida** en ese proyecto.

**Qué corre:** `createClaudeScanner` (`scan-handlers.ts:40-43`) lanza el CLI **siempre en `--permission-mode plan`**, con `agentId: 'security-reviewer'` y `trusted: false` aunque el proyecto sea de confianza (`src/infrastructure/scan/claude-scanner.ts:29-34`). El docblock lo dice entero: *"auditar es mirar. Un escáner que puede reescribir el código que audita deja de ser una medida"* (`:10-15`). El prompt exige un bloque JSON final con `severity`, `title`, `file`, `line`, `tipo` (de un vocabulario cerrado de 16 valores, `src/domain/scan/tipo-de-defecto.ts:13-46`) y `simbolo` (`src/domain/scan/report-contract.ts:8-29`).

**Dónde caen los hallazgos:** `runScan` → `persistScan` (`src/application/scan/run-scan.ts:32`). `persistScan` **no cierra ningún hallazgo** (`persist-scan.ts:13-17`): calcula el score sobre el *expediente* —lo reportado más los ACTIVE que este escaneo no nombró— (`:28-35`), y escribe en **una transacción** el histórico, los hallazgos, el score, la telemetría y la actividad (`commit-scan-rows.ts:35-49`). La escritura de hallazgos es *insertar-o-refrescar*: busca por identidad y, si la fila existe, la toca en vez de insertar (`src/infrastructure/persistence/finding-writes.ts:29-33`). Después, fuera de la transacción, reescribe `COGNITION-LOG.md` **dentro de la carpeta del proyecto auditado** (`persist-scan.ts:47-59`; `src/infrastructure/cognition/write-cognition-log.ts:17-40`, con guarda contra enlaces que salgan del proyecto en `:22-24`). Es la única escritura del escaneo sobre el disco del proyecto.

### 2.2 Hablar con el Terminal

La vista etiquetada **"Terminal"** en la barra lateral es `view='chat'`; la etiquetada **"Chat"** es `view='construir'` (`src/presentation/components/layout/SidebarRail.tsx:9,13`). Están invertidas a sabiendas y así lo documentan `docs/PAGES/terminal.md` y `docs/PAGES/chat-planificacion.md`.

**Los dos puentes desde Escaneo.** Hubo un tercero, un botón global «Preguntar al Terminal» que pedía explicar los hallazgos abiertos; se retiró porque confundía con el lote y no fijaba foco. Hoy son estos dos, y los dos **dejan el borrador escrito y no envían nada**: manda el operador.

1. **Por fila — «Resolver en Terminal»** (ADR-088, pieza 2). El icono de terminal de cada hallazgo (`FindingResolverAction.tsx:23`) llama a `resolverEnTerminal` (`src/presentation/services/resolver-en-terminal.ts:23-28`): fija el **foco** (`projectId` + `findingId`), escribe el borrador y abre el Terminal. Lo que el agente recibe sale de la base por el `findingId`, no del texto del borrador (`:5-9`).
2. **En lote — «Resolver lote en Terminal (N)»** (ADR-088, pieza del lote + Arco 1). Se marcan varios hallazgos **abiertos** con su casilla y la barra precarga un mensaje de **plan**. El Enter del operador manda ese turno en `supervisado` —solo lectura— y ahí **para**: `planDelLote` no arranca nada (`src/presentation/services/lote-por-enter.ts`). El humano lee el plan y un segundo gesto dispara la cola, que resuelve **un hallazgo por turno**, cada uno con su foco singular; Detener la corta. La casilla solo se ofrece donde el Terminal podría resolver de verdad —proyecto de confianza, que no sea el repo propio y con red git— (`src/domain/settings/terminal-puede-resolver.ts`).

**Disparo:** `IPC.chatSend` (`src/infrastructure/ipc/chat-send-handler.ts:48`), con `guardRun` delante (`:52`) y `isFortressRepo` inyectado como puerto (`:67`).

**Qué hace EXACTAMENTE**, en orden (`src/application/chat/send-message.ts:16-64`):

1. Si el proyecto está `PENDIENTE_CONFIGURACION`, solo hace la **entrevista de configuración**, en supervisado y sin escribir en disco (`:33-35`; `run-configuration-turn.ts:10-17`).
2. Calcula el **modo efectivo** (`:39-40`): pedido `autonomo` degrada a `supervisado` si el objetivo es el propio repo de FORTRESS, si la petición menciona un área protegida (auth, pagos, RLS, secretos… `src/domain/settings/protected-areas.ts:9-25`) o si el proyecto no es de confianza (`src/domain/settings/modo-efectivo.ts:36-41`).
3. Elige motor: CLI si está instalado, si no la API de solo texto (`choose-engine.ts:22-27`).
4. **Enruta** (`produce-reply.ts:35-48` → `reply-from-workflow.ts:35-38`): si el mensaje es una **orden** —contiene un verbo imperativo de la lista `revisa, escanea, audita, corre, ejecuta, busca, limpia, arregla, analiza…` (`src/domain/workflow/workflow-intent.ts:7-23`)— y casa con un workflow del catálogo (`seguridad`, `limpieza`, `bugs`, `tests`, `produccion`; `workflow-catalog.ts:24-56`), corre ese workflow paso a paso; si no, **conversa** (`route-workflow.ts:52-66`, `id === 'libre'` → `replyFromChat`).
5. Cada paso lanza el CLI con `permissionMode = permissionModeFor(mode)` (`src/application/workflow/run-workflow.ts:45`): **`plan` en supervisado, `acceptEdits` en autónomo** (`src/domain/settings/permission-mode.ts:25-27`). Un paso con `gate: true` (el de seguridad) que vea un CRITICAL detiene los siguientes (`run-workflow.ts:65-66`).

**Entonces, ¿analiza o arregla?** Depende del modo efectivo:

- En **supervisado** (el default, `operation-mode.ts:10`) el CLI corre en `plan`: **lee, analiza y propone; no escribe**. Es el caso siempre que el objetivo sea FORTRESS mismo.
- En **autónomo** sobre un proyecto **de confianza** el CLI corre en `acceptEdits` y **sí edita** el árbol de trabajo del proyecto. Solo entonces recibe una allowlist de comandos exactos `Bash(npm run <script>)` para autoverificarse (`src/domain/settings/safe-commands.ts:49-55`; `run-step.ts:23-31`). En ese camino **no hay checkpoint ni revert automático** (no existe `snapshot`/`revert` en `src/application/chat` ni `src/application/workflow`); la instrucción *"Si algo falla, revierte"* es texto del prompt (`operation-mode.ts:42-45`), no un mecanismo. La red git+verify sí existe, pero en otra superficie: el **Ejecutor** de la vista Construir (`src/application/build/build-feature.ts:6-14,24-38`).

### 2.3 LOOP / Autónomo

**Disparo:** el toggle del proyecto (`IPC.projectsSetLoopEnabled`) → `startLoop` (`src/infrastructure/loop/loop-controller.ts:44-57`). Al arrancar la app se reanudan los loops que quedaron vivos (`src/main/index.ts:41`; `loop-controller.ts:66-71`).

**La puerta:** `loopBlocked` (`src/domain/loop/loop-gate.ts:64-69`) exige proyecto **de confianza**, topes **fijados y positivos** (`loop-budget.ts:72-75`: sin `costCapUsd` y `maxCycles` guardados el loop no enciende, *"nadie decide por él cuánto está dispuesto a gastar"*, `:3-9`), y la coherencia repo-propio/modo. Se aplica en el controller y **otra vez** en el engine, *"cinturón y tirantes"* (`loop-engine.ts:32-35`). Revocar la confianza de un proyecto apaga y **detiene** su loop (`src/application/project/set-project-trusted.ts:26-29`).

**El ciclo** (`src/application/loop/run-loop.ts:23-70`): escaneo base → por vuelta: `nextStop` → espera 5 s → `deps.fix()` → contadores → re-escaneo solo cuando se acumulan integraciones (`loop-counters.ts:64-67`) → espera 10 s. `fix()` pasa por `guardRun` como cualquier corrida (`loop-fix.ts:34-41`) y llama a `runMotorChain` con un modo que **se deriva del proyecto, no se configura** (`loop-deps-factory.ts:51`):

```ts
const modo = params.hastaGate ? 'hasta-gate' : 'completo'
```

**Los tres cortes** (`src/domain/repair/modo-vuelta.ts:19`; `src/application/repair/run-motor-chain.ts:41-75`):

| modo | hasta dónde llega | quién lo usa |
|---|---|---|
| `hasta-gate` | elegir → entender → generar → gate; **no llama al revisor** (`:60`) | el LOOP sobre el **repo propio** |
| `hasta-omega` | …→ revisor; **no integra** (`:65`, `integrar=false`) | el **drenaje** (§4.4) |
| `completo` | …→ integra **si la política lo permite** (`:65,69-74`) | el LOOP sobre **código ajeno** |

**Cuándo para** (`src/domain/loop/loop-decision.ts:56-70`, en este orden de prioridad): intervención humana, tope de gasto de sesión, tope de propuestas, tres escaneos 100/100 seguidos (`resuelto`), baraja agotada, sin avance (fixes generados y descartados seguidos), demasiadas denegaciones seguidas de la política. La razón se persiste por proyecto y sobrevive al reinicio (`loop-session.ts:9-26`).

### 2.4 Exportar / Importar auto-mejora

**Exportar** (`IPC.systemExportObservations`, `system-handlers.ts:23`) escribe `auto-mejora.json` en `userData` —no en el proyecto, *"estas observaciones son sobre FORTRESS"*— con las observaciones **pendientes**, ordenadas y con su propia advertencia sobre el sesgo del orden dentro del fichero (`src/infrastructure/system/export-observations.ts:9,25-34`; `src/domain/system/observation-export.ts:9-20`).

**Importar** (`IPC.systemImportAttended`, `:26`) lee `atendidos.json` del mismo sitio y lo asienta en **una transacción idempotente**; el fichero **no se consume ni se reescribe** (`import-attended.ts:8,15-18,24-33`; `src/application/system/importar-atendidos.ts:17-49`). El contrato de cada entrada es cerrado: `id`, `status ∈ {atendido, descartado}`, `reason` (**obligatorio en el descarte**), `attendedBy`, `attendedAt`, `fixSha` opcional que se pega al motivo (`src/domain/system/atendidos-contrato.ts:21-30,58`; `importar-atendidos.ts:57`).

**El puente con Claude Code:** el export es lo que Claude Code lee en la terminal; el import es cómo vuelve. Y cierra el bucle: lo cerrado alimenta la sección *YA ATENDIDO* del prompt del analista para que no lo re-observe (`src/application/system/lo-ya-atendido.ts:40-42`; `src/domain/repair/analysis-prompt.ts:52`).

### 2.5 git push

**Disparo:** solo el botón de Escaneo (`ScanActions.tsx:53` → `push-service.ts` → `IPC.pushRun`). **Ni el loop, ni el motor, ni la firma llaman al push**; el único `git push` del repo está en `src/infrastructure/git/git-push.ts:22` y su único llamador es `pushProject`.

**Cuándo se bloquea** (`src/infrastructure/ipc/push-handlers.ts:56-74` y `src/application/push/push-project.ts:13-31`):

1. `guardMerge` —el turno del **merge**, no el del motor, porque lo que protege es la rama activa, y el circuit breaker de contaminación (`run-guard.ts:65-70`).
2. La carpeta tiene que ser la **raíz de su propio repo** según `git rev-parse --show-toplevel`; si no, *"el push publicaría el repo padre"* (`push-handlers.ts:12-37`).
3. `pushState` (`src/domain/project/push-readiness.ts:14-18`): sin remoto → no; sin escanear → no; **cualquier CRITICAL abierto → veto**. El veto deja asiento con evidencia en el Libro de la Vida antes de negar (`push-project.ts:23-26`; `record-push-decision.ts:14-46`).

Lo que se empuja lo decide git (`['push']` sin remoto ni rama, `git-push.ts:22`); es una deuda registrada.

---

## 3. El ciclo de vida de un hallazgo

Un hallazgo tiene **dos ejes ortogonales** y el dominio insiste en no mezclarlos (`src/domain/project/finding-lifecycle.ts:3-7`; `finding.ts:16-25`):

- **`lifecycle`** — qué le pasa al *problema*: `ACTIVE` · `MITIGATED` · `EXTINCT` (`finding-lifecycle.ts:18`).
- **`status`** — qué decidió el *operador*: `open` · `false_positive` (`finding-status.ts:1`). Solo lo abierto puntúa y bloquea el push (`:9-17`).

### Nacer

Un escaneo produce filas con identidad estable `fichero│tipo│símbolo` (`src/domain/project/finding-identity.ts:29-31`; ADR-067). Si esa identidad ya existe en el proyecto —viva o extinta— **no se inserta una segunda**: se refresca (`finding-writes.ts:29-33`; `SELECT_BY_IDENTITY` no filtra por ciclo de vida, `finding-sql.ts:39`). El refresco por defecto **revive**: `lifecycle = 'ACTIVE', resolved_at = NULL` (`finding-sql.ts:53-55`). Consecuencia medida y documentada: un proyecto que nace bajo ADR-067 no acumula duplicados de identidad (ADR-071, adenda del 2026-09-06).

### `ACTIVE` — y por qué sigue en el tablero aunque el escaneo no lo nombre

Desde ADR-065, **el escaneo no cierra nada**: *"no nombrar algo no es afirmar que no está"*. Lo ausente sigue ACTIVE, puntuando, y a la espera de que alguien lo mire (`src/domain/scan/ausencia.ts:20-25`; `persist-scan.ts:33`). Por eso existe el badge **`sin reconfirmar`**: no es un estado, es una función derivada —`lastSeen >= lastScan`— (`ausencia.ts:38-41`) que la fila pinta cuando el último escaneo no volvió a nombrarla (`src/presentation/components/scan/FindingMarks.tsx:30,34-41`). Meterlo como cuarto valor de `lifecycle` *"habría obligado a repasar los cinco sitios que filtran por ACTIVE"* (`ausencia.ts:30-34`).

### `MITIGATED` — "mitigado — pendiente de confirmar"

Lo escribe el **operador** desde la fila (`IPC.scanMitigate`, `finding-decision-handlers.ts:22-24` → `markMitigatedFinding`, `dismiss-finding.ts:30-38`) con una nota libre, normalmente el sha del arreglo. Solo desde ACTIVE (`finding-lifecycle-sql.ts:35-36`). Significa *"lo era y ya está arreglado"*, distinto de descartar, que significa *"no era un problema"* (`finding-decision-handlers.ts:7-11`). El badge dorado sale de `lifecycle === 'MITIGATED'` (`FindingMarks.tsx:48-52`) y **no se atenúa**: *"el problema puede seguir ahí y el escaneo aún no lo ha confirmado"* (`FindingRow.tsx:34-36`).

Un escaneo posterior que vuelva a ver el hallazgo **conserva** la marca si el fichero no cambió desde que se marcó (`src/application/scan/conservar-mitigado.ts:27-46`, con `TOUCH_CONSERVANDO`, que no toca el ciclo de vida, `finding-lifecycle-sql.ts:48-50`); si el fichero cambió después, vuelve a ACTIVE. El operador puede deshacer la marca (`MARK_ACTIVE`, `:59-60`). También la escribe un **agente** cuando dictamina OBSOLETO sin prueba comprobable, con prefijo que lo delata (`extinguir-con-juicio.ts:9,55`).

### `EXTINCT` — la única muerte, y siempre con motivo

Tres vías, ninguna es el escaneo:

1. **Juicio del analista con prueba.** Al drenar, C2 dictamina; solo `OBSOLETO` abre la puerta, y solo si el marcador literal que el análisis cita **se comprueba contra el fichero de hoy**; si no, mitiga (`src/application/repair/extinguir-con-juicio.ts:38-56`; `plan-repair.ts:61-63`).
2. **Fusión de duplicados** (migración manual, §9): la absorbida se marca EXTINCT con identidad centinela y `resolved_at` NULL (`finding-fusion.ts:49-57`).
3. `MARK_EXTINCT` exige fecha **y motivo**, y admite venir de ACTIVE o MITIGATED (`finding-lifecycle-sql.ts:23-24`).

Un hallazgo **no se borra nunca** (`finding-lifecycle.ts:13-16`).

### Los badges, en una tabla

| badge | condición | fichero |
|---|---|---|
| `sin reconfirmar` | `!confirmadoPorUltimoEscaneo(lastSeen, lastScan)` y no descartado | `FindingMarks.tsx:34-41` |
| ~~tachado~~ + `falso positivo` | `status === 'false_positive'`; fila a `opacity-45` | `FindingMarks.tsx:42-47`, `FindingRow.tsx:39` |
| `mitigado — pendiente de confirmar` | `lifecycle === 'MITIGATED'` | `FindingMarks.tsx:48-52` |
| *(no aparece)* | `EXTINCT` | `SELECT_BY_PROJECT` excluye extintos, `finding-sql.ts:21-22` |

### Lo que cuenta cada número

- **La tabla** muestra todo lo no extinto, descartados incluidos (`finding-sql.ts:21-22`).
- **El contador de severidades** cuenta `status='open' AND lifecycle != 'EXTINCT'`: **incluye los MITIGATED** (`finding-sql.ts:29-31`). Medido en solo lectura el 2026-09-07 sobre la base del operador: en `fortress-command-center`, 27 de los 50 contados estaban mitigados.
- **El score** puntúa lo reportado más los ACTIVE ausentes; un mitigado ausente no entra (`pesar-evidencia.ts:35` → `ausencia.ts:24`). Contador y score usan reglas distintas sobre los mitigados; nada en pantalla lo explica.

---

## 4. El motor de reparación y la firma

### 4.1 La máquina de estados

`ProposalState` (`src/domain/repair/proposal.ts:7-17`) y su tabla de transiciones (`:46-56`), que es el único juez (`:58-61`):

```
ELEGIDO → ANALIZADO → GENERADO → GATE → OMEGA → APROBADO → MERGEADO
   └─────────┴───────────┴────────┴───────┴─→ RECHAZADO / CADUCADO (terminales)
```

`GATE` significa *"pasado, esperando revisor"* (ADR-018); `OMEGA` significa *"aprobado, esperando firma humana"* (ADR-024). Los terminales no salen; una propuesta muerta no resucita, se abre otra (`:1-5`). Retirar una propuesta la **caduca** con la razón escrita (ADR-072; `repair-withdraw-handler.ts:20-26`).

### 4.2 Una vuelta entera (`runMotorChain`, `src/application/repair/run-motor-chain.ts:41-75`)

**C1 — Elegir** (`plan-repair.ts:29-44`; `elegir-objetivo.ts:25-42`). Candidatos: ACTIVE y abiertos, menos los obsoletos bajo este HEAD, los que ya tienen propuesta viva, los que fracasaron por una causa que repetir no arregla (`bloqueo-por-rechazo.ts:36-48`), y los fuera del alcance del modo (`alcance.ts:63-72`). Orden **determinista**: menor superficie de cambio, luego el más antiguo, luego la carpeta menos cargada (`select-target.ts:44-55`). Solo **LOW y MEDIUM** son elegibles en estreno (`debut.ts:16`). El HEAD se ancla **antes** de elegir (`plan-repair.ts:38-41`; ADR-008).

**C2 — Entender** (`plan-repair.ts:50-65`; `src/infrastructure/repair/graph-analyst.ts:53-70`). Un `claude -p` grafo-primero en **solo lectura** (`--permission-mode default` + `TOOLS_LECTURA`, `:25-26`), sin key propia y sin las llaves de la sesión viva (`buildEnv(null)`, `:28`). Tres veredictos, más un cuarto de entorno: `REAL → ANALIZADO`, `OBSOLETO → CADUCADO`, `ILEGIBLE → RECHAZADO`, `NO_ARRANCO → RECHAZADO` (`veredicto-del-analisis.ts:39-54`; ADR-066). Lo que el analista note de FORTRESS se guarda pase lo que pase (`plan-repair.ts:52-56`, §8).

**C3 — Generar** (`generate-fix.ts:12-43`). Worktree git aislado sobre `baseSha` (`worktree-manager.ts:28-31`), rama nombrada por id y slug (ADR-010), generador con `--permission-mode acceptEdits`, **sin Bash**, y techo de 30 turnos (`generator-args.ts:26-33`); *"el único agente del motor que EDITA, y solo dentro del worktree"* (`graph-generator.ts:24-28`). Los ficheros tocados los lee el motor con git, no el reporte del agente. La **correa** limita el fix al fichero del hallazgo, sus tests hermanos y, si acaso, vecinos del mismo directorio (`allowed-files.ts:33-74`; ADR-012). Commit dentro del worktree con `--no-verify` (`worktree-manager.ts:53-59`).

**I3 — Gate** (`run-gate.ts:27-68`). Antes de correr nada: worktree existe, está limpio, y el proyecto es **de confianza**, porque `npm ci` y los `npm run` ejecutan código del repo auditado (`gate-guards.ts:24-38`). Después, en **cola serial de uno** a nivel de proceso (`:20-21`; ADR-020), los comandos de verificación del propio proyecto —typecheck, lint, test, resueltos contra sus scripts reales (`safe-commands.ts:9-27`)— con entorno **acotado**: solo `PATH`, `HOME`, `CI` y unas pocas reenviadas si existen (`gate-env.ts:2-18,43-50`). Un rojo **heredado** (ya estaba en la base) no corta; un rojo propio sí (`gate-sequence.ts:35-43`). Verde → `GATE`.

**I4 — Revisor** (`run-omega-judge.ts:24-72`). Recibe el análisis, el diff y los ficheros antes/después (`omega-prompt.ts:32-41`), en lectura estricta desde el worktree (`graph-omega.ts:28-29`) con 15 minutos de plazo (`:15`). Devuelve seis ejes; **el veredicto global lo recomputa el motor**, no el agente (`omega-verdict.ts:21-33`): veta solo si no resuelve, si sale del scope, si toca lo prohibido, o si el riesgo residual es mayor. Aprobado → `OMEGA`.

**I5 — Integrar**, solo en modo `completo` y solo si el proyecto lo permite (§5).

Cada eslabón deja rastro en el **libro de vida de la propuesta** (`proposal-event.ts:5-8`: fases `SELECT…EXPIRE`, actores `motor | claude-analyst | claude-generator | gate | omega | human`) y cada corrida de agente en `agent_runs`, de donde sale el tope diario (`record-motor-run.ts:5-9`). El tope por propuesta es de 2 M tokens de **trabajo real** —sin contar relectura de caché— (`budget.ts:5,30-32`; ADR-068).

### 4.3 Dónde para a esperar firma, y qué ve el operador

La **cola de firma** se deriva del estado, no de una bandera: `ESPERAN = {'GATE', 'OMEGA'}` (`src/presentation/components/system/cola-de-firma.ts:11`). Esperan cosas distintas:

| estado | qué falta | firmar hace… |
|---|---|---|
| `GATE` | el juicio del revisor | pide el juicio (`firma-service.ts:15-17` → `IPC.repairRunOmega`) |
| `OMEGA` | la integración | integra (`firma-service.ts:19-21` → `IPC.repairSign`) |

**La página** es `FirmaView` (`view='firma'`, `MainArea.tsx:34`): una fila por propuesta, ordenadas por **fichero** antes que por fecha, paginadas, cada una con su propio botón (`FirmaView.tsx:15-23,25-67`; `cola-de-firma.ts:37-46`). Su subtítulo, literal: *"Propuestas de {proyecto} que ya pasaron el gate. Firmar es lo único que integra."* (`:13`). El **chip** de la barra superior la anuncia solo cuando hay algo esperando; con cero no se pinta (`FirmaChip.tsx:9-17,29-32`).

### 4.4 Qué toca al firmar

`IPC.repairSign` (`repair-sign-handler.ts:18-33`) toma el **turno del merge** —distinto del turno del motor, para que un drenaje de media hora no cierre la firma (`run-control.ts:13-18`)— y llama a `firmarIntegracion` (`src/application/repair/firmar-integracion.ts:31-55`):

1. Comprueba el veredicto **por el dato**, `omega.veredicto_global === 'APROBADO'` (`:40-45`).
2. Rechaza si el fix toca **ficheros que gobiernan la autonomía** (`defensasQueToca`, `:47-50`; §5).
3. **No pasa por el cerco** de auto-merge, a propósito: ese cerco decide *"si se integra SIN firma"* (`:23-26`).
4. `applyAutoMerge` con `via = 'firmada'` (`apply-auto-merge.ts:36-68`): **mide el árbol que resultará antes de tocar el vivo** si el destino se movió sobre ficheros del fix (`integrar-midiendo-el-arbol.ts:29-48`; ADR-069), y ejecuta:

```
git rev-parse --abbrev-ref HEAD        ← resuelve la rama; rechaza detached
git merge --no-ff <rama-del-fix> -m …  ← EL ÚNICO comando que escribe
git merge --abort                      ← si falla: el árbol queda como estaba
```
(`src/infrastructure/repair/git-merge-applier.ts:54-66`; ADR-006). El hijo corre con `buildEnv(null)`: los hooks del repo auditado no ven las llaves de la sesión (`:14-17`).

5. Éxito → `MERGEADO` + asiento en el Libro de la Vida con `via: 'firmada'` y el sha (`apply-auto-merge.ts:58-62`). Fallo → **`CADUCADO`**, nunca reintento ni rebase automático (`:25-30,65-66`).

**No toca `origin`.** El push sigue siendo un botón aparte (§2.5).

### 4.5 El drenaje

*"Drenar"* es recorrer los elegibles dejando cada fix **juzgado y esperando firma**, sin escanear y sin integrar (`drenar-hasta-omega.ts:9-19`, modo `'hasta-omega'` en `:48`). Se dispara desde la página del Motor tras un diálogo que muestra los elegibles y los topes reales (`ConfirmDrenaje.tsx:14-26`), reusa los topes del loop (`repair-drain-handler.ts:16-18`) y consulta el tope diario **en cada vuelta** (`drenaje-types.ts:56-66`). Su parte final clasifica cada baja en una tabla exhaustiva —correa, límite propio, entorno del proyecto, defecto interno…— y un cajón `sinClasificar` que se anuncia en vez de diluirse (`drenaje-types.ts:18-48`).

---

## 5. Código propio vs código ajeno

### 5.1 Cómo se distingue

`isFortressRepo(dir)` lee el `package.json` de la carpeta y compara `name === 'fortress-command-center'` (`src/infrastructure/system/self-project.ts:8,11-26`). Ni ruta ni remoto. Y una regla de duda: **un proyecto que no se puede ubicar cuenta como propio** —*"no saber de quién es el código no es permiso para integrarlo solo"*— (`integrable-sin-firma.ts:11-13,22`).

En el binario empaquetado, `selfProject()` devuelve `null` porque el código vive dentro del asar (`self-project.ts:49-51`): FORTRESS instalada no puede auto-registrarse como proyecto, pero una carpeta añadida a mano con ese `package.json` sí se reconoce como propia.

### 5.2 Las dos vedas, y por qué son dos

`src/domain/loop/loop-gate.ts` declara dos funciones distintas a propósito:

```ts
esHastaGate = (selfRepo) => selfRepo                       // :30 — hasta dónde TRABAJAR
integracionAutomaticaPermitida = (selfRepo) => !selfRepo   // :49 — si el árbol vivo se toca solo
```

*"Allí se decide hasta dónde TRABAJAR, que es inocuo porque pasa entero dentro de un worktree; aquí se decide si el árbol vivo se toca solo. Sobre el código propio no se toca solo nunca."* (`:43-47`). La segunda nació de tres integraciones automáticas del 22 de agosto que entraron por el botón de juicio sin que nadie hubiera autorizado la integración (`:33-41`).

### 5.3 Sobre FORTRESS: la firma es la única vía

| superficie | qué hace sobre el repo propio | dónde |
|---|---|---|
| LOOP | corre `hasta-gate`: acumula propuestas y **no llama al revisor** | `loop-deps-factory.ts:51`; `loop-gate.ts:17-20` |
| Botón de juicio (propuesta en GATE) | **juzga y para**; no arrastra la integración | `judge-and-integrate.ts:37-40,67`; `repair-omega-handler.ts:27-30` |
| Firma (propuesta en OMEGA) | integra —es la única que puede— | `firma-service.ts:31-35`; `firmar-integracion.ts` |
| Terminal en autónomo | **degrada a supervisado**, con aviso | `modo-efectivo.ts:36-41`; `operation-mode.ts:26-29` |
| Ejecutor (Construir) | **bloqueado** | `ConstruirView.tsx:8-10`; `run-build.ts:15-16` |
| Cualquier fix, también firmado | no puede tocar los ficheros de `AUTONOMY_RULES_FILES` | `firma-limite.ts:24-26`; `alcance.ts:46-48` |

Por qué motor y drenaje van aparte de la firma: los guards *"son archivos como cualquier otro. Un agente autónomo que 'limpia código muerto' sobre ellos puede desmontar su propia jaula sin ninguna mala intención"* (`modo-efectivo.ts:23-28`). La lista de esos ficheros —`loop-gate.ts`, `claude-cli.ts`, `self-project.ts`, `run-guard.ts`, `permission-mode.ts`, `apply-auto-merge.ts`, `judge-and-integrate.ts`…— vive en `auto-merge-blacklist.ts:6-30` y `innegociables-*.ts`, y se aplica como **resta final** que ninguna configuración alcanza (`auto-merge-config.ts:31-33,68`).

### 5.4 Sobre código ajeno: modo completo, pero con veda opt-in

El LOOP corre en `completo` (`loop-deps-factory.ts:51`) y `judgeAndIntegrate` sí puede llamar a `autoMergeProposal` (`judge-and-integrate.ts:66-68`). Lo que decide si integra es la **política del proyecto auditado**, leída de **`.fortress/config`** en su propia carpeta (`src/infrastructure/project/fortress-config.ts:7`; `auto-merge-proposal.ts:28`):

```ts
export const DEFAULT_POLICY: AutoMergePolicy = {
  enabled: false,        // ← auto-merge-policy.ts:23
  severities: ['LOW', 'MEDIUM'],
  maxDiffLines: 20,
  maxFiles: 5,
  blacklist: DEFAULT_BLACKLIST
}
```

**Es diseño, no accidente**, y el código lo dice: *"`enabled` nace en false a propósito. Un proyecto sin `.fortress/config` NUNCA integra solo; encenderlo exige escribirlo en un archivo que la lista de exclusión cubre a sí misma, así que el sistema no puede activarse solo"* (`auto-merge-policy.ts:15-21`). Tres estados y no dos: *no configurado* hereda el default; *configurado e ilegible* retira la integración automática, *"el sesgo seguro es retirar, no adivinar"* (`auto-merge-config.ts:5-14`). Con política encendida, el **cerco** evalúa seis condiciones y la denegación de cualquiera manda el fix a firma humana, nunca lo rechaza (`auto-merge-evaluation.ts:39-70`: interruptor, severidad, líneas del diff, número de ficheros, lista de exclusión, y el fichero resultante bajo 75 líneas, ADR-069).

Resumen honesto: **sobre código ajeno el LOOP no para por doctrina, para por configuración.** La garantía dura (`integracionAutomaticaPermitida`) es solo del repo propio; lo que protege a un proyecto ajeno hoy es que su `.fortress/config` no existe o está apagado.

### 5.5 La confianza (`trusted`) es otra línea, y separa leer de ejecutar

`project.trusted` nace en `false` (`project.ts:33-38`; ADR-044). **Leer no la exige** —escanear es justo lo que se hace antes de decidir si confiar—; **ejecutar sí** (`confianza.ts:12-14`). Sin confianza: el gate rechaza (`gate-guards.ts:31-38`), el CLI no recibe allowlist de `npm run` (`safe-commands.ts:43-55`), el `.mcp.json` del proyecto no se carga (`claude-code-agent.ts:50-52`), el loop no enciende (`loop-gate.ts:66`), los probes de calidad no corren (`run-quality-audit.ts:9-12`) y el Terminal degrada a supervisado (`modo-efectivo.ts:38-39`).

---

## 6. Los 11 agentes

Son un **catálogo de datos**, no código (ADR-045, ADR-053): `AGENT_IDS` (`src/domain/agent/agent.ts:2-14`), siete activos por defecto (`default-agents.ts:4-55`) y cuatro opcionales (`optional-agents.ts:3-37`). Viajan al CLI como JSON en `--agents`, uno por uno, y el que atiende va en `--agent` (`claude-cli.ts:40-41`). Cada uno declara su **modelo** como alias, no como id fijo (ADR-078; `agent.ts:35-40`):

| agente | modelo | propósito (del catálogo) | activo |
|---|---|---|---|
| security-reviewer | `opus` | Secrets, inyecciones, auth, headers y rate limiting. **Es el que escanea** (`claude-scanner.ts:31`) | sí |
| code-reviewer | `sonnet` | Bugs, errores no manejados y edge cases. Fallback del router (`agent-router.ts:20`) | sí |
| refactor-cleaner | `haiku` | Código muerto, imports sin usar y duplicación | sí |
| tdd-guide | `sonnet` | Tests que reproducen el bug antes del fix | sí |
| planner | `opus` | Planifica features y evalúa impacto antes de tocar | sí |
| cognition | `opus` | Patrones aprendidos y reflexiones por sesión | sí |
| **sentinel-omega** | `opus` | Meta-auditor: contrasta lo que reportan los demás contra el filesystem real. Única con **carta propia** (`sentinel-omega.ts:7-31`) | sí |
| build-error-resolver | `sonnet` | Diagnostica y arregla fallos de build | no |
| e2e-runner | `sonnet` | Ejecuta tests end-to-end y verifica flujos completos | no |
| code-simplifier | `haiku` | Reduce complejidad sin cambiar comportamiento | no |
| opensource-sanitizer | `haiku` | Prepara el repo para publicarse sin filtrar nada | no |

El criterio del reparto es **qué hace** el agente: *juzgan* (opus) · *ejecutan contra algo comprobable* (sonnet) · *barren* (haiku) (ADR-078, sección "El reparto"). Ninguno en Fable, por doctrina de cero telemetría (ADR-078, "Por qué ninguno en Fable").

**Alcance:** el router elige por palabras clave del mensaje (`agent-router.ts:4-18`), y los workflows del catálogo los encadenan en orden (`workflow-catalog.ts:24-56`). Si el proyecto auditado define su propio agente en `.claude/agents/<id>.md`, FORTRESS le cede los de personalización pero **nunca** `security-reviewer` ni `sentinel-omega`: *"si el código auditado pudiera traer su propio security-reviewer.md, controlaría el prompt de quien lo audita"* (`agents-for-project.ts:6-12,19-31`; `project-agents.ts:4-9`).

**Los actores del motor no son estos once.** `claude-analyst`, `claude-generator` y el revisor del motor son fases del motor con procesos propios (`graph-analyst.ts`, `graph-generator.ts`, `graph-omega.ts`) y actores del libro de vida (`proposal-event.ts:8`); el analista y el generador se asientan **sin** id de agente a propósito (`record-motor-run.ts:11-14`). El revisor sí: se asienta como `sentinel-omega` (`run-omega-judge.ts:51`, `record-motor-run.ts:13-14`) —ver §7.

---

## 7. OMEGA / Sentinel

"OMEGA" nombra **tres cosas** en este código, y conviene no confundirlas:

### 7.1 Sentinel Omega — el 11º agente, meta-auditor

Su carta (`src/domain/agent/sentinel-omega.ts:7-20`): *testigo, no actor* · *evidencia o silencio* (cada afirmación con archivo:línea) · *discrepancia, no intención* · *falible por diseño* · *grafo primero*. ADR-046 registra lo que se le **rehusó** a propósito: un toggle que miente, el pensamiento inferido, el veredicto infalible. **"OMEGA solo puede FRENAR; quien promueve es el gate por riesgo."**

**Qué juzga:** desde la vista Sentinel Omega (`view='omega'`), `IPC.omegaAudit` verifica **cada hallazgo abierto contra el filesystem** —¿existe el fichero?, ¿está la línea?— y deja un asiento por hallazgo con veredicto `ok | discrepancia` y evidencia (`src/application/omega/audit-project.ts:14-32`; `verify-findings.ts:10-17`). De ahí sale una puntuación por agente en bandas —`confiable-absoluto` ≥ 90 … `no-usar` < 40, y `sin-datos` cuando no hay base— ponderando veracidad 0,6 y cumplimiento 0,4 (`omega-score.ts:36-43,46-55`).

**Cómo veta:** (a) el **push**, dejando constancia de cuántos CRITICAL verificó en disco (`record-push-decision.ts:14-46`); (b) la **promoción de una capacidad** cuando su banda cae a `no-confiable` o peor —y *"sin evidencia NO veta: es silencio, no aprobación"* (`capability-gate.ts:13-26`). Sus asientos van a `omega_log`, el **Libro de la Vida**, que solo anexa: *"no hay borrar ni editar: el registro es eterno por diseño"* (`sqlite-omega-log.ts:32`), con clases `verificacion | score | nota | merge` y veredictos `ok | discrepancia | info | veto` (`omega-entry.ts:9,15`).

### 7.2 El revisor del motor (documentado como `claude-omega`)

Es otro proceso y otro prompt: *"Eres OMEGA, revisor semántico INDEPENDIENTE del motor de reparación. Juzgas si el fix resuelve el hallazgo sin daño colateral"* (`omega-prompt.ts:32-41`), lanzado por `graph-omega.ts` en lectura estricta desde el worktree, *"replica el patrón del generador a propósito — juez y ejecutor no comparten código"* (`:21-22`). Sus seis ejes son evidencia; el veredicto lo recomputa el motor por cuatro vías duras (`omega-verdict.ts:21-33`). `docs/AGENTS.md:13-19` lo llama `claude-omega` y subraya que es distinto de Sentinel Omega; en telemetría, sin embargo, su corrida se asienta bajo el id `sentinel-omega` (`run-omega-judge.ts:51`), lo que mezcla ambos en las estadísticas por agente —anotado como deuda.

### 7.3 El estado `OMEGA` de una propuesta

Significa "el revisor aprobó; falta la firma" (ADR-024; `proposal.ts:12`). No es un agente.

---

## 8. La auto-mejora

Es el bucle por el que FORTRESS observa sus propios defectos trabajando en otros proyectos y los cierra con firma. Cinco piezas, todas en el código:

1. **Observar.** El analista de C2, además de su veredicto, deja *notas sobre FORTRESS mismo*: un límite, un bug, un gap, algo que le faltó, una oportunidad (`self-observation.ts:1-8`). Se guardan pase lo que pase con el hallazgo, *"un límite del que se topó vale igual si el hallazgo era un fantasma"* (`plan-repair.ts:52-56`; el parser en `parse-analysis.ts:9`).
2. **Ver.** La vista *Auto-mejora FORTRESS* (`view='sistema'`, `SelfImprovementView.tsx:10-13`) lista el backlog entero de diez en diez con recuento por estado —`pendiente | atendido | descartado`, vocabulario cerrado (`self-observation.ts:23`)— y no agrupa por tema porque `area` es prosa libre (`ObservationsSection.tsx:12-20`).
3. **Exportar / trabajar fuera / importar** (§2.4). Quien trabaja el backlog —Claude Code en la terminal— escribe `atendidos.json`; el import exige motivo en cada descarte (`atendidos-contrato.ts:26`).
4. **Recordar.** Lo cerrado alimenta la sección *YA ATENDIDO* del prompt del analista, con la razón y el sha del arreglo, para que no vuelva a observarlo (`lo-ya-atendido.ts:7-28,40-42`).
5. **Cerrar con firma.** Los arreglos al código de FORTRESS entran por el mismo motor que cualquier proyecto, pero en el repo propio la única puerta al árbol vivo es la firma (§5.3).

**Capacidades y génesis** (ADR-051 a ADR-054) son la segunda mitad de la vista: una *oportunidad* observada puede proponerse como capacidad —`funcion | herramienta | agente`— que madura por **episodios** reales: nace a 1 000, prueba hasta 20 000, oficial a 50 000 (`capability.ts:1-17`). Lo reversible avanza solo; **un agente nuevo exige aprobación humana** (`capability-lifecycle.ts:25-28`; ADR-052), y OMEGA puede vetar el salto por evidencia (`capability-gate.ts`). El bucle de génesis entrena un episodio por iteración en un **sandbox** y en `plan` —no edita— (`run-learning-episode.ts:7-12,22-25`), con topes propios y el tope diario mandando sobre el de sesión (`run-genesis.ts:22-51`; `genesis-decision.ts:26-33`).

---

## 9. Alcance y límites actuales

### 9.1 Qué SÍ hace hoy

- Escanear con un agente en solo lectura y guardar hallazgos con identidad estable (§2.1).
- Tablero por proyecto con score determinista (`score-from-findings.ts:16-22`) y veto de push por CRITICAL (§2.5).
- Terminal que conversa o corre workflows de agentes; edita solo en autónomo sobre proyectos de confianza (§2.2).
- Motor de reparación completo: worktree, gate hermético, revisor, firma con merge `--no-ff` y medida previa del árbol (§4).
- Loop autónomo con topes duros y razón de parada persistida (§2.3).
- Drenaje a firma desde la página del Motor (§4.5).
- Auditoría de calidad en seis dimensiones con **circuit breaker**: si el audit no deja el proyecto byte-idéntico, no se persiste el score y el proyecto queda **contaminado** hasta revisión humana (`run-quality-audit.ts:26-32`; `contamination.ts:8-10`).
- Exposición externa (*Superficie externa*): solo sobre sitios que el operador declara suyos, con filtro anti-SSRF de dos capas (`run-posture.ts:14-24`; `blocked-target.ts:20-27`).
- Grafo de código por MCP `codebase-memory`, inyectado en **todo** spawn de agente y con solo herramientas de lectura pre-autorizadas (`graph-mcp.ts:1-6,16-40`); reconciliación con HEAD al arrancar (`reconcile-service.ts:26-33`).
- Configuración guiada de un proyecto nuevo: entrevista en solo lectura y escritura del marco solo tras "Sí, ejecutar" (`execute-configuration.ts:12-16`).
- Auto-mejora con export/import y génesis de capacidades (§8).
- Al arrancar: reanuda loops, reconcilia grafos y reclama worktrees huérfanos (`src/main/index.ts:36-48`; `reclaim-service.ts:6-19`).

### 9.2 Qué NO hace

- **No encierra al código ajeno.** El gate y el CLI *acotan el entorno* —quitan las llaves de la sesión viva— pero el código del repo auditado *"sigue corriendo con el usuario y ve el disco entero"*; contener de verdad *"exige un sandbox, y eso es otra pieza"* (`gate-env.ts:32-36`; `build-env.ts:12-19`).
- **No mide el árbol después de integrar.** Mide antes (ADR-069); lo que rompe tras el merge no lo detecta nadie (deuda registrada como arco).
- **No hace push por sí misma**, en ningún modo (§2.5).
- **No integra en el repo propio por ninguna vía automática** (§5.3).
- **No fusiona duplicados desde la app** (9.3).
- **No trabaja HIGH ni CRITICAL en el motor:** el estreno sigue en LOW/MEDIUM (`debut.ts:16`).
- **No revierte automáticamente** lo que el Terminal edita en autónomo (§2.2); esa red solo existe en el Ejecutor.
- **No garantiza instancia única** de la app (deuda `sin-candado-de-instancia-unica`).

### 9.3 Lo que vive en `scripts/` y no en el binario

`electron-builder.yml` excluye `scripts/*` del empaquetado, y `vitest` solo incluye `src/**/*.test.ts` (`vitest.config.ts:18`): **lo que está en `scripts/` ni viaja ni lo cubre el gate unitario**. Lo que hay ahí:

| pieza | qué es |
|---|---|
| `scripts/fase-b-clasificar.ts` · `fase-b-ejecutar.ts` · `fase-b-verificar.ts` · `fase-b-criterio-6.ts` | La **fusión de duplicados**: migración manual, una vez por proyecto, con el modelo para reclasificar y una transacción única para fundir. **No es capacidad de la app y no debe cablearse** (ADR-071, adenda 2026-09-06): los escaneos nuevos no producen duplicados por construcción (§3). Su red de verificación —criterios 1-5— se movió a `src/infrastructure/persistence/red-de-la-fusion.ts` el 2026-09-06 para que el gate la cubra. |
| `scripts/reparar-gravedad.ts` · `fusion-plan.ts` · `select-target.ts` · `analyze-target.ts` | Runners de **solo lectura** (`reparar-gravedad.ts:38-40`: `readonly: true` fijo). El modo de escritura se eliminó del repo el 2026-09-06: *"la máquina NO PUEDE, no es que no deba"* (`:9-22`). |
| `scripts/integration-test.cjs` · `migration-test.cjs` · `render-smoke.cjs` · `checks/*.cjs` | La suite de integración, migración y smoke que corre `npm test` y `npm run smoke` (`package.json`). |
| `scripts/backfill-events-i1.5.ts` · `caduca-cadena-sintetica.ts` | One-shots idempotentes ya ejecutados. |
| `scripts/ui-preview.cjs` · `make-icons.cjs` · `scan-verification.cjs` · `install.sh` | Herramientas del operador. |

### 9.4 Lo que se tree-shakea, y por qué no todo `main` viaja al binario

El bundle del main (`out/main/index.js`) contiene solo lo alcanzable desde `src/main/index.ts`; el del renderer, lo alcanzable desde su entrada. **Un módulo correcto, testeado y mergeado que nadie importa desde esas raíces no está en la app.** Medido el 2026-09-06 sobre los AppImages `272fd170` (build de `63aab71`) y `5eee7527` (build de `main@0cc862b`), extrayendo `out/main/index.js` del asar:

| identificador | ocurrencias | por qué |
|---|---|---|
| `createFindingFusion`, `planDeFusion`, `severidadDeLaSuperviviente`, `redDeLaFusion` | **0** | su único consumidor real es `scripts/`; en `src/` solo los importan fixtures y tests |
| `masUrgente` (`severity.ts`) | **0** | mismo fichero que `SEVERITIES` (6) e `isSeverity` (11), que sí viajan: el podado es por símbolo, no por fichero |
| `SELF_REPO_EXIGE_FIRMA` (`loop-gate.ts:52`) | **0** | declarada y documentada, sin ningún uso |
| `runLoop`, `firmarIntegracion`, `applyAutoMerge`, `createGitMergeApplier`, `colaDeFirma` | 2-5 | el flujo LOOP+firma sí está entero |

La regla operativa que se deriva: **contar commits no mide la deriva entre `main` y el binario**; lo mide un grep por identificador contra el asar. `docs/` sí se empaqueta —esta misma página viajará—; `internal/`, `templates/`, `scripts/` y los `CLAUDE.md` de la raíz no (`electron-builder.yml`, bloque `files`).

### 9.5 Deudas de código relevantes (nombres, para que el operador decida)

Registradas y abiertas a fecha de este documento, solo las de código: `git-push-rama-implicita` · `parser-codicioso` · `commit-repair-miente-en-el-asunto` · `sin-candado-de-instancia-unica` · `verify-graph-spawnea-sin-registrar` · `gate-baseline-timeout-bajo-carga` · `deteccion-de-lo-que-rompe-tras-integrar` (arco) · `extinct_reason-sin-consumidor` · `escape-no-cierra-modales` · `claude-cli-timeout-frio` · `marcador-al-nacer-sin-verificar` · `identidad-inestable-FASE-B-backfill` (las 98 filas de identidad vieja de un proyecto ajeno). Las nuevas que destapó este recorrido se anotaron en el registro de deudas el 2026-09-07.

---

## 10. El Terminal autónomo: el juicio antes del código

**Escrita el 2026-09-19 sobre `f2cc7f8`.** Cubre ADR-089 a ADR-097 — lo que el
Terminal aprendió entre el 17 y el 19 de septiembre. Manda sobre las §1-9 en
todo lo que toque al Terminal.

### 10.1 El recibo: qué herramientas corrió el turno

Cada turno deja constancia de las herramientas que usó
(`domain/chat/recibo-de-herramientas.ts`), y se **tacha antes de cortar**, nunca
al revés. Se persiste en la última puerta —`persistence/agent-run-insert.ts`,
por donde pasa todo INSERT— y vive en la columna `recibo` de `agent_runs`.

Un turno que gastó y no dice qué hizo no es un turno auditado: es un cargo.

### 10.2 El diff que se juzga incluye lo creado

`git diff` no ve un fichero nuevo, así que OMEGA juzgaba fixes a los que les
faltaba justo el fichero que resolvía el hallazgo.
`infrastructure/git/trabajo-del-turno.ts` los busca con
`git ls-files --others --exclude-standard` y `diff-de-creados.ts` compone su
diff a mano — **nunca `git add -N`**, que mutaría el índice del cliente.

### 10.3 El crítico, y el debate

`domain/agent/critico.ts` define un agente cuyo trabajo es **buscar el fallo**,
no confirmarlo; su modelo se deriva de la escalera, nunca de un literal. Corre
por `infrastructure/repair/graph-critico.ts`, con el ciclo de proceso propio.

El tribunal se llama solo cuando hay diff que atacar
(`application/chat/tribunal-con-critico.ts`) y factura como `critico` en
`agent_runs`. El debate corrió por primera vez en vivo el 2026-09-19: **396 s y
$1,93**.

### 10.4 El juicio del PLAN: OMEGA en la silla del aprobador

En autónomo no hay humano esperando, así que **OMEGA juzga la dirección antes de
que nadie toque código** (ADR-097):

1. El productor propone un plan para los **N hallazgos del lote**.
2. `application/chat/juez-del-plan.ts` los **relee de la base** por sus ids —del
   mensaje solo se aceptan ids— y se los pasa a OMEGA con la prosa del productor
   (`domain/chat/plan-prompt.ts:28`). El vocabulario es propio:
   **`ADELANTE` / `REPLANTEA`**, distinto del `APROBADO`/`VETADO` del fix **a
   propósito**, para que nadie confunda un cedazo blando con la revisión dura.
3. `application/chat/ciclo-del-plan.ts` repropone **mientras la propuesta
   avance** (huella del texto, no un cupo). A la primera huella repetida le deja
   una vuelta más; a la segunda **para**.
4. `infrastructure/chat/ciclo-del-plan-del-turno.ts` aprueba el lote llamando a
   `aprobarLote` **desde el proceso principal**.

### 10.5 La puerta: en autónomo es IMPOSIBLE ejecutar sin aprobación

`infrastructure/plan-guard.ts:36` rechaza cualquier turno que ejecute un
hallazgo del lote si `hallazgoAprobado` dice que no. Tres propiedades que la
hacen una garantía y no un consejo:

- **Vive en el main**, junto a `guardRun`, y **antes** que él: negar después de
  reservar el carril lo dejaría tomado para siempre.
- **Lee el modo de la BASE** (`esAutonomoDeVerdad`), nunca `input.mode`: el turno
  de plan manda `supervisado` a propósito, y fiarse del mensaje sería preguntarle
  al que quiere pasar si tiene permiso.
- **La aprobación la escribe solo el main** (`aprobacion-del-plan.ts:22`), en
  memoria y por hallazgos. El renderer no puede firmar su propio permiso.

### 10.6 Los desenlaces, dichos en voz clara

- **ADELANTE** → el lote se ejecuta solo, sin un clic.
- **REPLANTEA dos veces** → *«Decisión abierta — necesita un humano»*
  (`domain/chat/decision-abierta.ts`), escrito en el hilo. Dice qué pasó, que
  **no se ejecutó nada**, y que se espera al operador. No dice «no convergió»:
  eso es cómo se llama el fallo por dentro, no qué necesita quien lo lee.
- **OMEGA ilegible** → no se aprueba **y no se anota decisión abierta**: una
  avería no es un límite alcanzado.

### 10.7 Lo que el operador VE mientras corre

`domain/chat/fase-del-turno.ts` nombra la fase (`debate` · `juicio` · `plan`) y
`RunMeter.tsx` le da tono con tokens del tema. Antes el medidor contaba tiempo y
dinero pero nunca lo que se hacía: seis minutos de crítico trabajando por $1,93
se leían como «no hizo nada».

### 10.8 El modo ya no frena por palabra — en ningún sitio

ADR-089 retiró del código la lista `auth`/`payments`/`RLS`/`seguridad`. El
2026-09-19 se retiró también **del prompt**, donde había sobrevivido pidiéndole
al modelo que la aplicara a mano (`domain/settings/instruccion-de-modo.ts`).

### 10.9 Lo que NO está cerrado

**Cinco defectos medidos en el ensayo del 2026-09-19 y el resto de deudas viven
en [DEUDAS.md](DEUDAS.md)**, con evidencia y orden de arreglo. Los dos que más
cambian lo de arriba:

- **La aprobación de OMEGA no caduca**: `olvidarAprobacion` no tiene llamadores.
- **El turno de plan del lote se cree en supervisado**, y eso además le bloquea
  el grafo (`permission-mode.ts:26` da `'plan'`, que mata el MCP).

Y sigue pendiente **ADR-092, el sandbox**: sin él, Bash libre (ADR-093, pieza 3)
está bloqueado, y con él la verificación de stacks que no son Node.

---

## 11. Glosario

Términos propios de este código, con su significado **real** y dónde está definido.

- **Alcance (de una vuelta)** — Qué hallazgos vale la pena elegir según hasta dónde llegue la vuelta: en `completo` solo lo que el cerco admitiría; en `hasta-gate`/`hasta-omega` todo menos las defensas. Se deriva del modo, no se configura (`alcance.ts:50-72`).
- **Auto-mejora / observación** — Nota que un agente deja sobre FORTRESS mismo mientras trabaja en otro proyecto; `bug | gap | limitacion | falta | oportunidad`, estado `pendiente | atendido | descartado` (`self-observation.ts`).
- **base_sha** — HEAD del repo en el momento de elegir; ancla del worktree y del merge (`proposal.ts:33-34`; ADR-008).
- **Capacidad / episodio / génesis** — Función, herramienta o agente que FORTRESS se propone a sí misma y madura por episodios reales; génesis es el bucle que la entrena en sandbox (`capability.ts`, `run-genesis.ts`).
- **Carril / turno** — Exclusión por proyecto. Son **dos**: el del **motor** (escaneo, chat, drenaje, propuestas) y el del **merge** (firma, push), porque son dos recursos (`run-control.ts:13-22`).
- **Centinela** — Identidad `fusionada:<ganadora>|<identidad vieja>` que retira de circulación la clave de una fila absorbida al fundir; no se vacía porque `''` cae en el PENDING de la migración (`fusion-de-duplicados.ts:30-35`).
- **Cerco** — Las condiciones bajo las que un fix se integra **sin firma**: política encendida, severidad, líneas, ficheros, lista de exclusión y fichero resultante ≤ 75 líneas (`auto-merge-evaluation.ts:39-70`). Con firma delante, no aplica.
- **Confianza (`trusted`)** — Permiso para **ejecutar** código del repo auditado; leer no la exige (`confianza.ts`; ADR-044).
- **Contaminado** — Circuit breaker: el audit de calidad no dejó el proyecto byte-idéntico; bloqueado hasta revisión humana (`contamination.ts:8-10`; `run-guard.ts:47-51`).
- **Corpus / docs-first** — Los documentos canónicos que el proyecto auditado **realmente tiene**, con su categoría, para que el prompt cite lo firmado y calle si no hay nada (`corpus-descriptor.ts:10-15`; ADR-064).
- **Correa (allowedFiles)** — Los únicos ficheros que un fix puede tocar: el del hallazgo, sus tests hermanos y vecinos del mismo directorio que la prosa nombre (`allowed-files.ts:33-74`; ADR-012).
- **Debut / estreno** — Severidades que el motor puede trabajar hoy: LOW y MEDIUM (`debut.ts:16`; ADR-007).
- **Drenaje** — Recorrer los elegibles dejándolos juzgados y esperando firma, sin escanear ni integrar (`drenar-hasta-omega.ts`).
- **Expediente** — Lo reportado por el escaneo más los ACTIVE que no nombró; sobre eso puntúa el score (`persist-scan.ts:28-35`).
- **Firma** — El acto humano que integra una propuesta aprobada al árbol vivo con `git merge --no-ff`; la única vía sobre el repo propio y la vía por defecto sobre cualquier proyecto sin `.fortress/config` (`firmar-integracion.ts`).
- **Fingerprint** vs **identidad** — La identidad (`fichero│tipo│símbolo`) es la clave estable entre escaneos; el fingerprint lleva la línea y gobierna los descartes del operador (`finding-identity.ts:25-27`).
- **GATE** — Dos cosas: el **runner** mecánico (typecheck/lint/test del proyecto dentro del worktree, ADR-015) y el **estado** "gate pasado, esperando revisor" (ADR-018).
- **Grafo** — El MCP `codebase-memory`, memoria del código que evita releerlo; viaja en todo spawn y solo con herramientas de lectura pre-autorizadas (`graph-mcp.ts`).
- **guardRun / guardMerge** — Las dos guardias del main: contaminación + tope diario + turno del motor, y contaminación + turno del merge (`run-guard.ts:21-29,65-70`).
- **hasta-gate / hasta-omega / completo** — Los tres cortes de una vuelta del motor (`modo-vuelta.ts:19`).
- **Heredado (rojo)** — Un comando del gate que ya fallaba en la base antes del fix; no corta la cadena (`gate-sequence.ts:35-43`).
- **Libro de la Vida** — `omega_log`, el registro append-only de Sentinel Omega (`sqlite-omega-log.ts:32`). No confundir con el **libro de vida de una propuesta**, que es `proposal_events` (`proposal-event.ts`).
- **loopBlocked / esHastaGate / integracionAutomaticaPermitida** — La puerta del loop y las dos vedas del repo propio (`loop-gate.ts:30,49,64-69`).
- **Mitigado** — Marca del operador (o de un agente sin prueba): "hay un fix aplicado, falta confirmar que ya no aparece" (`finding-lifecycle.ts:10`).
- **OMEGA** — Tres significados: el agente Sentinel Omega, el revisor del motor, y el estado de propuesta (§7).
- **PENDIENTE_CONFIGURACION** — Proyecto recién creado; el chat solo hace la entrevista de configuración hasta que su marco se escribe (`project.ts:45-49`).
- **Reconfirmado / sin reconfirmar** — Si el último escaneo del proyecto volvió a nombrar el hallazgo; derivado, no un estado (`ausencia.ts:38-41`).
- **Repo propio / self-repo** — La carpeta cuyo `package.json` se llama `fortress-command-center` (`self-project.ts:8`).
- **Standby** — Fase del loop cuando el proveedor falla de forma transitoria: espera y reintenta en vez de morir (`loop-deps-factory.ts:24-27`).
- **Superseded** — Una propuesta que otra reemplazó; cuenta como "no llegó a GENERADO" (ADR-013).
- **Terminal / Chat / Construir** — *Terminal* es la vista `chat` (cartera + ventana que actúa); *Chat* es la vista `construir` (Plan / Investigación / Ejecutor). Invertidos a sabiendas (`SidebarRail.tsx:9,13`; `docs/PAGES/terminal.md`).
- **Tope diario / por corrida** — `--max-budget-usd` por spawn (default $3) y suma del día (default $10) leída de `agent_runs`, que sobrevive al reinicio (`run-budget.ts:12-13`; `run-guard.ts:36-39`).
- **Vía de integración** — `automatica | firmada`; viaja como dato hasta el asunto del commit y el Libro (`via-de-integracion.ts:17`).
- **Worktree** — Árbol git aislado sobre `base_sha` en los datos de la app, donde el motor genera, compila y juzga sin tocar el repo vivo (`worktree-manager.ts`; ADR-009).
