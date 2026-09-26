# ADR-105 — La guarda de barrera cubre TODO turno que edita: barrera sana edita, barrera muerta bloquea con recibo

- **Estado**: Aceptada (firmada por el operador el 2026-09-26)
- **Fecha**: 2026-09-26
- **Alcance**: la guarda de barrera del pre-vuelo (`barrera-guard.ts`) deja de
  negar solo el lote del chat y niega **cualquier turno que edite** un proyecto
  cuya barrera declarada no arranca: el turno suelto del Terminal en autónomo
  (y el workflow que corre dentro), y el Ejecutor de Construir. La observación
  se asienta en los tres. **No toca** qué es una barrera rota (`barrerasRotas`),
  ni el lector del pre-vuelo, ni el modo, ni la correa, ni el tribunal.
- **Relación**: es la sub-pieza 1 del arco #5 del ROADMAP (seguridad). Amplía lo
  que ADR-098 §3 decidió para el lote y DEUDAS §5.3 dejó escrito como «no se
  amplía sin decidirlo». Hereda la doctrina de ADR-093 §3.4: la defensa vive
  donde no se puede esquivar.
- **Nace de**: la medición del #5 del 2026-09-25 (main `d9146e9`): dos flujos
  editan un proyecto con barrera muerta sin la red que se construyó para eso.

## 1. Lo medido, contra `main@d9146e9`

### 1.1 Lo que la guarda hace hoy

`guardBarrera(context, input: SendMessageInput)` (`src/infrastructure/barrera-guard.ts:45-55`):
busca el proyecto por `input.projectId`, lee sus hooks `PreToolUse` con
`barrerasDelProyecto`, **asienta siempre** la observación de barrera rota
(`observacionesDeBarreras`, `kind: bug`, área `barrera-del-proyecto`), y niega
**solo** si `ejecutaUnLote(input) && esAutonomoDeVerdad(context)` (línea 54).
`ejecutaUnLote` es «trae lista y hallazgo enfocado» (`plan-guard.ts:14-15`); el
modo sale de la base, nunca del mensaje. Se limitó al lote a propósito: ADR-098
§3 decidió el fail-closed para el lote autónomo, y el docblock (líneas 40-43)
dice que un turno suelto «también edita y esta guarda lo deja pasar… quitar
`ejecutaUnLote` es una línea y no se amplía sin decidirlo». Este ADR es esa
decisión.

### 1.2 Los dos flujos que editan sin la guarda

1. **El turno suelto del Terminal en autónomo, y el workflow dentro de él.**
   `send-message.ts:58` marca el turno como `activa` cuando el modo es autónomo
   y el motor es el CLI; con eso el turno se lanza con `acceptEdits`
   (`permissionModeFor('autonomo')`), abre checkpoint y pasa por el gate
   (`conRedDeReversion`), pero **sin OMEGA ni crítico**: el juicio exige un
   hallazgo enfocado (`turno-del-terminal.ts`, «con juicio solo cuando… un
   hallazgo enfocado»). El workflow de agentes corre por ese mismo turno
   (`reply-from-workflow` es el `producir`). Todo entra por
   `chat-send-handler.ts:29`, que YA llama a `guardBarrera` la primera de las
   tres puertas y conoce `input.projectId`: solo cambia la condición de negar.
2. **El Ejecutor de Construir.** `build-handlers.ts:36-38` envía `build:feature`
   a `withGuard(projectId, runBuild)`, que solo toma el carril (`guardRun`) y
   **nunca** llama a `guardBarrera`: ni niega ni asienta la observación.
   `run-build.ts` resuelve el proyecto (`resolveEditTarget`: exige git y prohíbe
   el repo propio) y `buildFeature` lanza el agente con `acceptEdits` y
   `trusted: true` sobre el proyecto vivo, con checkpoint, `verificarArbol` y
   reversión en rojo. El `projectId` está en la mano desde el handler. Plan e
   Investigación no editan y quedan fuera.

### 1.3 Lo que no hay que confundir

Las tres puertas del chat van en este orden por razones ya escritas: la guarda de
barrera **primera** (para que la observación se asiente pase lo que pase),
`guardPlanAprobado` después, y `guardRun` la última porque **reserva** el carril
y negar tras reservar lo dejaría tomado. El Ejecutor tiene la misma restricción:
negar **antes** de `guardRun`, o dentro del `try` que lo suelta.

## 2. DECISIÓN — Barrera sana edita, barrera muerta bloquea con recibo, en los tres

1. **Qué turnos cubre la guarda**: todo turno que edita el proyecto. Son tres
   entradas: el lote del chat (ya cubierto), el turno suelto del chat en
   autónomo con su workflow (`chat-send-handler`), y el Ejecutor de Construir
   (`build:feature`). Plan, Investigación, el chat supervisado y el chat por API
   no editan y no se niegan.
2. **La regla, la misma del primer órgano**: barrera declarada **sana** (o
   ninguna declarada) → el turno edita; barrera declarada **muerta** (su
   intérprete no existe) → el turno **no corre**, con recibo legible que dice qué
   barrera y por qué, y la observación asentada. Fail-closed solo ante barrera
   muerta: la confianza más el autónomo siguen siendo la firma del operador para
   editar; lo que se niega es editar con la red pintada en el suelo.
3. **El modo del chat sale de la base**, como hoy (`esAutonomoDeVerdad`), y el
   turno cuenta como «edita» si además va por el CLI (`engine: 'claude-code'`;
   el chat por API no puede tocar el disco). El Ejecutor **siempre edita**: su
   plan lo aprobó un humano, pero las ediciones las hace el agente sin nadie
   delante, así que la barrera muerta lo niega sea cual sea el modo guardado.
4. **La observación se asienta en los tres**, bloquee o no, con la dedup de
   ADR-085 que ya funde el mismo proyecto turno tras turno.
5. **El recibo persiste donde el operador lo lee**: en el chat, como hoy
   (`err(BARRERA_ROTA)`); en Construir, dentro de `runBuild`, antes de
   `buildFeature`, para que la fila «Construcción no aplicada: …» quede en el
   historial igual que cualquier otro fallo del Ejecutor.

## 3. Cómo se construye (para dimensionar, no para decidir)

- `guardBarrera(context, projectId, edita)`: la observación siempre; niega si
  `edita` y hay barrera muerta. El chat pasa
  `edita = esAutonomoDeVerdad(context) && input.engine === 'claude-code'`; el
  Ejecutor pasa `edita = true`. `BARRERA_ROTA` deja de hablar solo del lote.
- Dos sitios de llamada más allá del actual: el mismo `chat-send-handler.ts:29`
  (cambia la condición) y `run-build.ts` tras `resolveEditTarget`.
- Tests: los seis de `barrera-guard.test.ts` siguen, y el de «un turno SUELTO
  no es un lote: pasa» se invierte; nuevos: turno suelto autónomo con barrera
  muerta → negado con recibo y observación; con barrera sana → pasa; en
  supervisado → pasa; chat por API → pasa; Ejecutor con barrera muerta → negado,
  recibo en el historial, observación; con barrera sana → construye.
- Mutantes: volver a `ejecutaUnLote &&` → cae el suelto; quitar la guarda del
  Ejecutor → cae; quitar la observación del Ejecutor → cae; negar con barrera
  sana → cae.
- `docs/IPC.md`: las filas de `chat:send` y `build:feature` ganan «guardBarrera».
  `barrera-guard.ts` ya es innegociable. Coste: bajo, una sesión corta.

## 4. Lo que NO está en este ADR

- El tribunal (crítico y OMEGA) para el turno suelto y para Construir: son las
  sub-piezas 6 y siguientes del #5.
- Mirar `PostToolUse`: la línea sigue en `PreToolUse`, que es el que puede decir
  que no (DEUDAS §5.3).
- Leer `.claude/settings.local.json`: DEUDAS §8.5, aparte.

## 5. Consecuencias

- Un proyecto con barrera muerta ya no recibe ediciones autónomas por ninguna
  puerta: ni lote, ni turno suelto, ni workflow, ni Ejecutor. El operador lo ve
  en el recibo y el backlog lo aprende por la observación.
- Un proyecto con barrera sana o sin barreras no cambia nada.
- Lo que se pierde: la posibilidad de construir en autónomo sobre un proyecto
  cuyo hook no arranca. Es lo que se quiere perder.

## 6. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta: las
marcó el 2026-09-26 por orden del operador, con su línea literal:

> *«yo Jojo dueño del proyecto FORTRESS firmo ADR-105 con las cinco casillas sí,
> como el CTO recomienda: (1) ampliar a los tres flujos, (2) fail-closed solo
> ante barrera muerta, (3) el Ejecutor negado sea cual sea el modo, (4) la
> observación en los tres, (5) leído §5.3 y el docblock — Jojo, 26 septiembre
> 2026»*

1. **Ampliar la guarda a los tres**: lote del chat, turno suelto con su workflow,
   Ejecutor de Construir: [x] sí · [ ] solo al chat · [ ] otra: ________
2. **Fail-closed solo ante barrera muerta**: barrera sana o ninguna → edita;
   muerta → no corre, con recibo: [x] sí · [ ] otra: ________
3. **El Ejecutor se niega sea cual sea el modo guardado** (siempre edita sin
   nadie delante): [x] sí · [ ] solo si el modo guardado es autónomo
4. **La observación se asienta en los tres**, bloquee o no: [x] sí
5. **He leído DEUDAS §5.3 y el docblock de `barrera-guard.ts`**: la limitación al
   lote fue a propósito y esta es la decisión de ampliarla: [x]

**Firma del operador:** Jojo, dueño del proyecto FORTRESS · **Fecha:** 26 septiembre 2026
