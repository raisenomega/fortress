# Comunicación inter-proceso (IPC)

FORTRESS es una aplicación Electron con separación estricta: el renderer
(React, sin acceso a Node), el preload (puente tipado con aislamiento de
contexto) y el proceso principal (Node: filesystem, SQLite, spawns de
agentes). Toda comunicación entre renderer y main pasa por canales IPC
nombrados. Este documento enumera los **105 canales** del sistema, su
dirección, su contrato y sus guards — por clase, sin ubicaciones.

## Aislamiento

- `contextIsolation: true` y `nodeIntegration: false` en cada ventana.
- El preload expone un único objeto tipado vía `contextBridge`; el renderer
  solo puede llamar lo que ese objeto expone — no hay `require()` ni
  `process`.
- La API key jamás cruza el bridge: el renderer solo puede preguntar si
  existe.

Toda operación renderer → main usa el patrón request/response
(invoke/handle). **FORTRESS no usa fire-and-forget en ningún canal** —
decisión de diseño, no omisión: el renderer siempre recibe confirmación de
que su petición se procesó, y una Promise rechazada es una señal explícita
de error que un send silencioso nunca daría.

Modelo de amenazas completo: [SECURITY-MODEL](SECURITY-MODEL.md).

## Fuente única de verdad de nombres de canal

Los 105 nombres viven en un agregador central compartido: un módulo
principal de constantes más 6 sub-módulos por dominio funcional. El proceso
main importa esas constantes para registrar handlers; el preload importa
LAS MISMAS para invocar y suscribir; el renderer no ve constantes — solo el
objeto tipado del preload.

Consecuencia estructural: no puede haber un canal en main sin exposición en
preload (ni al revés) sin editar el agregador central, lo que fuerza a
revisar a los tres consumidores. Un canal nuevo con string literal ad-hoc
queda inmediatamente fuera del contrato. La convención: el canal se declara
primero en el agregador, después se implementan handler y exposición.

## Direcciones de canal

1. **Request/response** (`invoke` ↔ `handle`): 96 canales. Promise tipada,
   retorno garantizado. Los resultados falibles usan un tipo `Result`
   explícito (ok con valor, o error con razón) — el error de negocio viaja
   como dato, no como excepción.
2. **Push main → renderer** (`send` ↔ `subscribe`): 9 canales. Streaming y
   notificaciones de estado.
3. **Fire-and-forget:** 0 canales. No existe en el sistema.

## Canales por dominio

Formato: cada dominio con su tabla — canal exacto, dirección
(R/R = request/response, PUSH = main → renderer), contrato observable y
guards por clase. "guardRun" = guardia de una-corrida-por-proyecto para
operaciones que gastan modelo o procesos pesados.

### projects

Gestión del catálogo de proyectos y su confianza.

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `projects:list` | R/R | () → Project[] | — |
| `projects:add` | R/R | NewProject → Result<Project> | validación de ruta absoluta |
| `projects:remove` | R/R | id → Result<null> (juicio a las propuestas vivas, luego cascada en BD) | — |
| `projects:pick-folder` | R/R | () → NewProject \| null (diálogo nativo) | — |
| `projects:self` | R/R | () → NewProject \| null (el repo propio) | — |
| `projects:set-trusted` | R/R | (id, trusted) → Result<null> | decisión explícita del operador |
| `projects:set-loop-enabled` | R/R | (id, enabled) → Result<null> | bloqueo del loop sobre el self-repo |
| `projects:focus` | R/R | id → null (dispara reconcilio del grafo) | — |
| `projects:unblock` | R/R | (id, motivo?) → Result<null> (levanta el circuit breaker) | exige que el proyecto ESTÉ contaminado |

`projects:remove` hace tres cosas en orden, y el orden importa: deja un
`FORTRESS-RECORD.md` en la carpeta del proyecto, **caduca con juicio** cada
propuesta viva —razón `proyecto_retirado`, con asiento en el Libro de la Vida— y
solo entonces borra la fila, dejando que la cascada del esquema limpie el resto.
El paso intermedio existe porque la cascada borraría en silencio, y el asiento
del juicio solo sobrevive en la única tabla sin clave foránea
([ADR-076](DECISIONS/adr-076-el-juicio-antes-de-la-cascada.md)).

### chat

Chat por proyecto que actúa de verdad, con streaming.

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `chat:history` | R/R | projectId → ChatMessage[] | — |
| `chat:append` | R/R | NewChatMessage → Result<ChatMessage> | — |
| `chat:clear` | R/R | projectId → void | — |
| `chat:send` | R/R | SendMessageInput → Result<SendMessageOutput> | guardBarrera (ADR-105: observa siempre; niega todo turno que edita —suelto, lote o workflow— si la barrera del proyecto está muerta); guardRun; modo autónomo exige proyecto confiable; bloqueo hasta CONFIGURADO |
| `chat:stop` | R/R | projectId → number (procesos matados, kill de grupo) | — |
| `chat:chunk` | PUSH | ChatChunk (streaming del agente) | — |
| `chat:progress` | PUSH | ChatProgress { index, total, tokens, costUsd } — medidor | — |

`chat:progress` es un MEDIDOR de avance del workflow, no un flujo de eventos
de estado: empuja `{ index, total, tokens, costUsd }` (qué herramienta toca
en curso y cuánto se lleva gastado), no señales `started`/`done`/`error`. El
cierre de la conversación llega por la resolución de la Promise de
`chat:send`; el aborto, por `chat:stop`.

### scan

Escaneo de seguridad con agentes reales.

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `scan:run` | R/R | projectId → Result<ScanSummary> | guardRun |
| `scan:findings` | R/R | projectId → Finding[] | — |
| `scan:counts` | R/R | () → Record<projectId, SeverityCounts> | — |
| `scan:history` | R/R | (projectId, limit) → ScanRecord[] | — |
| `scan:history-since` | R/R | iso → ScanRecord[] | — |
| `scan:dismiss` | R/R | findingId → Result<null> (sobrevive re-escaneos) | — |
| `scan:reopen` | R/R | findingId → Result<null> | — |
| `scan:mitigate` | R/R | (findingId, nota) → Result<null> (el operador declara que ya está arreglado) | solo desde ACTIVE; la nota es obligatoria |
| `scan:unmitigate` | R/R | findingId → Result<null> (deshace la marca) | solo desde MITIGATED |
| `finding:verify` | R/R | (projectId, findingId) → Result<DictamenDeVerificación \| null> (el analista lee el fichero y dictamina; NO crea propuesta) | guardRun; solo desde MITIGATED |
| `finding:verify-all` | R/R | projectId → ResultadoVerificaciónMasiva (TODOS los mitigados, uno detrás de otro; lista fija al arrancar, sin tope dentro, cobertura declarada al cerrar) | guardRun |
| `finding:verify-selected` | R/R | (projectId, ids[]) → ResultadoVerificaciónMasiva (las que el operador marcó; mismo motor y mismo Detener, sólo cambia quién decide la lista) | guardRun |
| `finding:verify-all-stop` | R/R | projectId → number (detiene el barrido: el mitigado en curso termina, el siguiente no arranca) | — |
| `scan:historia` | R/R | projectId → FindingHistoria[] (lo CERRADO, con de qué murió cada uno; lo reciente arriba y lo que no se resolvió al final) | — |
| `scan:progress` | PUSH | ScanChunk (avance del escaneo) | — |

> **El informe que devuelven los agentes** no cruza el IPC como tal: llega en el
> bloque JSON final de su salida, definido por `REPORT_CONTRACT`. Pide
> `severity`, `title`, `file`, `line`, **`tipo`** y **`simbolo`**. Los dos
> últimos son la identidad estable del hallazgo: el tipo se ELIGE de un
> [vocabulario cerrado](TAXONOMIA-DE-DEFECTOS.md) y el símbolo es la función que
> contiene el defecto. Fuera del vocabulario cae a `otro` sin tumbar el escaneo.
> Ver [ADR-067](DECISIONS/adr-067-identidad-fichero-tipo-simbolo.md).

### repair (motor de auto-reparación)

Los canales del flujo [SELF-REPAIR](FLOWS/SELF-REPAIR.md).

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `repair:propose` | R/R | projectId → Result<Proposal \| null> (C1+C2) | guardRun |
| `repair:list` | R/R | projectId → Proposal[] | — |
| `repair:get` | R/R | id → Proposal \| null | — |
| `repair:events` | R/R | proposalId → ProposalEvent[] (el libro de vida) | — |
| `repair:generate` | R/R | proposalId → GenerateResult (C3 en worktree) | guardRun; correa; presupuesto |
| `repair:run-gate` | R/R | proposalId → RunGateResult | guardRun; cola serial de juicio |
| `repair:run-omega` | R/R | proposalId → RunOmegaResult | guardRun; reserva de presupuesto; cola serial |
| `repair:retry` | R/R | proposalId → RetryResult (propuesta NUEVA con C2 fresco) | guardRun; solo rechazos de razonamiento |
| `repair:sign` | R/R | proposalId → AutoMergeResult (la firma humana) | guardMerge; exige veredicto APROBADO; no alcanza las defensas |
| `repair:withdraw` | R/R | (proposalId, motivo?) → Result<null> (la CADUCA) | exige no terminal; **sin** guardRun |
| `repair:drain` | R/R | projectId → DrenajeResultado (recorre los elegibles hasta OMEGA) | guardRun |
| `repair:drain:stop` | R/R | projectId → number (cancela el drenaje en curso) | — |
| `repair:cerco` | R/R | projectId → ResumenCerco (cuántos elegibles y por qué) | — |
| `repair:guia-de-firma` | R/R | projectId → { n, guia } (orden sugerido, grupos, dependencias al final) | — |
| `repair:medir-tanda` | R/R | projectId → Result<ResultadoDeTanda> (sonda del conjunto; bisección en rojo) | guardMerge; solo mide: no firma, no integra, no caduca |
| `repair:changed` | PUSH | projectId (el expediente de ese proyecto se movió) | — |

#### Notas de estado

**Las tres salidas de una propuesta viva, y en qué se distinguen.** `repair:sign`
la integra —es la única puerta al árbol vivo, y pide `guardMerge` porque la rama
activa es un recurso compartido—. `repair:retry` no la mueve: abre una propuesta
NUEVA sobre el HEAD actual con un C2 fresco, y solo para los rechazos de
razonamiento (ver [FLOWS/RETRY](FLOWS/RETRY.md)). `repair:withdraw` la CADUCA con
el motivo del operador, y es la única de las tres que **no** pide `guardRun`: no
spawnea nada, no gasta un token y no toca el árbol — mueve una fila y deja dos
asientos. Exigirle el carril cerraría la única salida de una propuesta justo
mientras el motor trabaja. Ver
[ADR-072](DECISIONS/adr-072-caducado-no-miente.md).

**`repair:withdraw` no exige que el proyecto ni el hallazgo sigan existiendo**, y
es deliberado: retirar tiene que funcionar precisamente cuando ya no están. Una
propuesta huérfana —su proyecto borrado debajo— no aparece en ninguna vista,
porque toda la interfaz del motor lista por proyecto; el canal la alcanza igual.

**Lo que ninguno de los tres hace es disponer del hallazgo.** Que vuelva a la
cola es consecuencia de que su propuesta deje de ser viva. Declararlo arreglado
es otro acto y vive en el Escaneo (`scan:mitigate`).

### graph

El Knowledge Graph y su realineado ([FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md)).

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `graph:status` | R/R | projectId → GraphStatus | — |
| `graph:install` | R/R | projectId → Result<GraphStatus> | guardRun |
| `graph:verify` | R/R | projectId → GraphVerify | guardRun |
| `graph:ab` | R/R | (projectId, question) → Result<GraphAb> | guardRun |
| `graph:reindex` | R/R | projectId → ReconcileOutcome (manual) | cola serial de 1 |
| `graph:state` | R/R | projectId → ReindexSnapshot \| null | — |
| `graph:progress` | PUSH | { projectId, delta } (salida del verify/ab) | — |
| `graph:reindex:changed` | PUSH | projectId (el estado del índice cambió) | — |

### system (capacidades, génesis, observaciones)

El ciclo de auto-mejora: observaciones → capacidades → episodios → fases.

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `system:observations` | R/R | () → SelfObservation[] | — |
| `system:resolve-observation` | R/R | id → Result | — |
| `system:capabilities` | R/R | () → Capability[] | — |
| `system:propose-capability` | R/R | input → Result<Capability> | — |
| `system:promote-capability` | R/R | id → Result (gate por riesgo) | veto de OMEGA; agente nuevo exige humano |
| `system:capability-notes` | R/R | capabilityId → Note[] | — |
| `system:add-capability-note` | R/R | (capabilityId, note) → Result | — |
| `system:agent-draft` | R/R | capabilityId → borrador \| null | — |
| `system:set-agent-draft` | R/R | borrador → Result (redacción humana v1) | — |
| `system:activate-agent` | R/R | capabilityId → Result | firma humana previa |
| `system:deactivate-agent` | R/R | capabilityId → Result (toggle reversible) | — |
| `system:draft-agent-auto` | R/R | capabilityId → Result (redacción por agente) | guardRun; sandbox |
| `system:run-episode` | R/R | capabilityId → Result (episodio real) | guardRun; sandbox |
| `system:genesis-toggle` | R/R | on/off → Result (topes obligatorios) | topes de coste |
| `system:genesis-status` | PUSH | estado del bucle de génesis | — |

### omega

El panel del meta-auditor y el Libro de la Vida.

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `omega:audit` | R/R | projectId → Result<OmegaAuditReport> | — |
| `omega:list` | R/R | projectId → OmegaEntry[] (registro eterno) | — |
| `omega:score` | R/R | projectId → Result<OmegaScore> (evidencia o null) | — |
| `omega:agents` | R/R | projectId → AgentHealth[] | — |
| `omega:runs` | R/R | projectId → AgentRun[] | — |
| `omega:agent-runs` | R/R | agentId → AgentRun[] | — |
| `omega:snippet` | R/R | (projectId, file, line) → Result<FileSnippet> | lectura confinada al proyecto |

### build (modo Construir)

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `build:plan` | R/R | (projectId, intent) → Result<string> | guardRun |
| `build:investigate` | R/R | (projectId, intent) → Result<string> | guardRun |
| `build:feature` | R/R | (projectId, intent, plan) → Result<void> | guardRun; guardBarrera (ADR-105: el Ejecutor edita siempre, se niega sea cual sea el modo, recibo en el historial); proyecto confiable |
| `build:stop` | R/R | projectId → number | — |
| `build:pick-file` | R/R | () → string \| null (diálogo nativo) | — |

### new-project / config / docs (alta gobernada)

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `new-project:home-dirs` | R/R | () → HomeDir[] | — |
| `new-project:plan-folder` | R/R | draft → Result<FolderPlan> | validación de ruta padre |
| `new-project:create-folder` | R/R | (draft, useExisting) → Result<string> | validación de ruta; sin traversal |
| `new-project:register` | R/R | EmptyProjectInput → Result<Project> | — |
| `config:execute` | R/R | (projectId, drafts) → Result<string> | allowlist de nombres de documento; guard de traversal; el gitignore va primero |
| `docs:list` | R/R | projectId → nombres de docs del marco | — |
| `docs:read` | R/R | (projectId, nombre) → contenido | allowlist de nombres |

### settings

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `settings:get` | R/R | key → string \| null | lista blanca de claves |
| `settings:set` | R/R | (key, value) → void | lista blanca de claves |
| `settings:save-api-key` | R/R | plainKey → Result<ApiKeyVerdict> (valida contra la API y cifra) | safeStorage; redacción en logs |
| `settings:has-api-key` | R/R | () → boolean (lo único que el renderer puede saber) | — |
| `settings:check-api-key` | R/R | () → ApiKeyVerdict | — |
| `settings:clear-api-key` | R/R | () → void | — |

### telemetry

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `telemetry:session` | R/R | () → TokenUsage | — |
| `telemetry:billing` | R/R | () → Billing | — |
| `telemetry:average` | R/R | projectId → MeasuredRun \| null | — |
| `telemetry:since` | R/R | iso → TokenUsage | — |
| `telemetry:sin-factura` | R/R | iso → { runs, durationMs } (corridas sin coste medible) | — |
| `telemetry:by-project` | R/R | iso → Record<projectId, TokenUsage> | — |
| `telemetry:ranking` | R/R | (iso, limit) → AgentRanking[] | — |

### activity / agent

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `activity:project` | R/R | (projectId, limit) → Activity[] | — |
| `activity:agent` | R/R | (agentId, projectId?, limit) → Activity[] | — |
| `agent:stats` | R/R | (agentId, projectId) → AgentStats | — |

### connectors

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `connectors:list` | R/R | () → ConnectorState[] | — |
| `connectors:set-enabled` | R/R | (id, on) → void | — |
| `connectors:add` | R/R | NewConnector → Result<ConnectorState> | — |
| `connectors:remove` | R/R | id → Result<null> (builtin no se borra) | — |

### account

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `account:status` | R/R | () → Account | — |
| `account:login` | R/R | () → void (spawn del login interactivo) | proceso rastreado para stop |
| `account:login-output` | PUSH | texto del login en curso | — |

### posture / quality / push / health / cognition

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `posture:run` | R/R | PostureRequest → Result<PostureResult> | guardRun; validación de host (anti-SSRF); confirmación de propiedad |
| `quality:run` | R/R | projectId → Result<IntegralScore> | guardRun; circuit breaker de contaminación |
| `push:run` | R/R | projectId → Result<string> | guardMerge; bloqueo por hallazgos CRITICAL abiertos; la carpeta debe ser la raíz de su propio repo |
| `health:run` | R/R | () → HealthReport (self-diagnóstico) | — |
| `cognition:read` | R/R | projectId → CognitionSnapshot (parsea, jamás ejecuta) | — |

### maintenance

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `maintenance:keep-awake` | R/R | enable → void | — |
| `maintenance:cleanup` | R/R | () → { killed } (limpia procesos colgados) | — |
| `maintenance:live-jobs` | R/R | () → number | — |

### loop (solo push)

| Canal | Dir | Contrato | Guards |
|---|---|---|---|
| `loop:last-session` | R/R | projectId → LoopSession \| null (la última sesión, con su razón de parada) | — |
| `loop:status` | PUSH | LoopStatus (estado del ciclo autónomo) | — |
| `loop:chunk` | PUSH | ChatChunk (salida del ciclo en curso) | — |

Este dominio expone SOLO push de estado: no hay invocaciones
renderer → main del loop autónomo pre-motor (su encendido va por
`projects:set-loop-enabled`, con su guard). Su comportamiento se documenta
en `docs/FLOWS/LOOP-VIEJO.md`. El loop autónomo está
planificado para retiro en un incremento futuro, en favor del motor
disciplinado.

## Contratos de streaming

Secuencia típica de un canal de streaming (chat, escaneo, build): chunks
incrementales por push mientras la invocación request/response sigue
pendiente; la Promise original resuelve al final con el resultado completo
(o el error). El aborto va por su canal de stop (`chat:stop`,
`build:stop`), que mata el GRUPO de procesos del agente y devuelve cuántos
mató.

### Helper `subscribe(channel, listener) → Unsubscribe`

Los 9 canales de push se consumen a través de un helper genérico tipado
expuesto por el preload:

```ts
useEffect(() => {
  const unsubscribe = api().chat.onChunk((chunk) => aplicar(chunk))
  return unsubscribe
}, [])
```

El helper oculta el `IpcRendererEvent` al renderer (el listener solo recibe
el payload — lo único que debería poder tocar) y devuelve la función de
des-suscripción para el cleanup del componente. Usar `ipcRenderer.on`
directamente no es el patrón del proyecto: expondría internals de Electron
y causaría fugas de listeners al desmontar.

## Guards transversales

Por clase (ubicaciones y detalle interno: fuera de este documento).

La columna **Guards** de las tablas de arriba no se mantiene a mano: un test
la lee y la contrasta con las llamadas reales de `guardRun` y `guardMerge`
en los registros de handlers, canal por canal. Nació de una deriva concreta
— dos filas decían «—» con el guard puesto —, y esta tabla es justo lo que
consulta quien juzga si a un canal le falta un guard por descuido o por
decisión: cuando miente, el veredicto sale al revés.

- **guardRun** — una corrida por proyecto para toda operación que gasta
  modelo o lanza procesos pesados (12 familias de handlers la aplican:
  chat, scan, quality, posture, build, acciones de grafo, redacción y
  episodios de capacidades, y los eslabones del motor).
- **guardMerge** — el turno de la RAMA ACTIVA, que es otro recurso: lo
  piden `repair:sign` y `push:run`, las dos operaciones que la escriben o
  la publican. Trae además el circuit breaker de contaminación.
- **Confianza (Workspace Trust)** — el modo autónomo y el loop exigen
  proyecto confiable; el flag se cambia solo por decisión explícita del
  operador.
- **Bloqueo del self-repo** — los ciclos autónomos no operan sobre el
  código del propio FORTRESS; verificado en dominio y aplicado en capas.
- **Validación de rutas** — todo canal que recibe paths valida absoluto y
  sin traversal; las escrituras originadas por agentes pasan por allowlist
  de nombres.
- **Validación de host** — todo fetch externo rechaza hosts privados en
  todas sus formas ([SECURITY-MODEL](SECURITY-MODEL.md)).
- **Presupuestos y colas** — los eslabones del motor verifican presupuesto
  antes de gastar y serializan sus juicios.

## Errores comunes

- **Canal sin handler:** una Promise que nunca resuelve. El agregador
  central hace este error casi imposible; si aparece, el canal se añadió
  fuera de la convención.
- **Listener sin cleanup:** suscribirse a push sin guardar el Unsubscribe
  fuga listeners al desmontar; el helper existe para eso.
- **Payload no serializable:** IPC usa structured clone — funciones,
  símbolos o referencias circulares no viajan.

## Trazabilidad

Todo handler que gasta tokens o muta estado persistente emite a su registro
(libro de vida del motor, telemetría de corridas, actividad). La superficie
viva de canales se infiere del objeto que el preload expone — que es
exactamente lo que enumera este documento.

## Referencias

- [ARCHITECTURE](ARCHITECTURE.md) — dónde viven preload y handlers.
- [SECURITY-MODEL](SECURITY-MODEL.md) — el modelo de amenazas de esta
  superficie.
- [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md) y [FLOWS/RETRY](FLOWS/RETRY.md)
  — los canales de repair en acción.
- [FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md) — los canales de graph en
  acción.
- [DATA-MODEL](DATA-MODEL.md) — las tablas que estos handlers leen y
  escriben.
- [GLOSSARY](GLOSSARY.md) — términos.
