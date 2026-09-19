# ADR-097 — El autónomo se aprueba con OMEGA y muestra lo que hace: el juicio del plan, el debate visible, y la puerta de ejecución cerrada

- **Estado**: Aceptada
- **Fecha**: 2026-09-18
- **Alcance**: Terminal autónomo — el lote, desde que se propone el plan hasta
  que el fix se conserva
- **Relación**: completa la **Fase B** de ADR-096 haciéndola visible · ocupa el
  hueco que **ADR-088 arco 1** dejó nombrado (*«en la pieza 5 será OMEGA quien
  apruebe en autónomo»*) · hereda de **ADR-091** la honestidad del
  `desconocida` · aplica la doctrina de **ADR-079** (*«sin red no se edita»*) a
  la aprobación del plan
- **Nace de**: el primer ensayo en vivo del debate (raisen-núcleo, 18-sep), que
  probó que la Fase B **funciona** y que es **muda**.

---

## §0 — La ley aplicable

ADR-090 §0 sigue entera, y ADR-091 §0 le pone el complemento que este ADR
ejecuta:

> *«"Sin frenos" gobierna lo que el agente **puede hacer**. **Saber qué corrió NO
> es un freno**: es la otra mitad del grado bancario. Un banco deja la
> transacción hecha **y da el recibo**; si solo hiciera una de las dos no sería
> un banco. El parte registra lo que corrió, nunca silencio.»*

**Este ADR es esa otra mitad.** No añade capacidad: hace visible la que ya hay, y
sustituye una espera humana por un juicio automático.

---

## 1. El ensayo: el debate corre, y no se ve

### 1.1 Lo que la base dice

raisen-núcleo, hallazgo HIGH en `services/pdf-api/templates/report.html:26`.
Medido en `agent_runs`:

| Agente | Duración | Coste | Hora |
|---|---|---|---|
| `productor` | 978 s | $4.09 | 01:03:38 |
| **`critico`** | **395 s** | **$1.93** | **01:19:20** |
| `sentinel-omega` | 71 s | $0.48 | 01:20:32 |
| `productor` (reintento) | 338 s | $2.00 | 01:20:32 |

**Es la primera fila de `critico` que ha existido nunca**
(`SELECT COUNT(*) WHERE agent_id='critico'` → 1).

Y el orden es el que ADR-096 diseñó: el crítico termina, **OMEGA arranca al
segundo siguiente**, y el productor vuelve a hablar. **Productor → gate →
crítico navega → OMEGA juzga → reintento.** La Fase B corrió entera, sobre
código real.

**6 min 35 s y $1.93** es el perfil de un agente que **navega**, frente a los
71 s de OMEGA que solo mira el diff. El crítico salió a leer el código, como su
carta le manda.

### 1.2 Lo que el operador vio

**Nada.** Ni el naranja del debate, ni el azul de OMEGA, ni un número de agentes
en la barra. El operador concluyó —razonablemente— que el crítico no se había
disparado. **La medición decía lo contrario.**

### 1.3 El fallo real

**FORTRESS gastó $1.93 y 6 minutos contradiciéndose a sí misma, y no lo dijo.**

Eso no es un adorno pendiente: es **el silencio que ADR-091 §0 prohíbe**. Un
banco que mueve dinero y no emite extracto no es un banco aunque la transacción
sea correcta.

**La UI deja de ser el final del arco y pasa a ser la cara del autónomo.**

### 1.4 Y en autónomo pidió permiso

El turno mostró *«Modo supervisado: no aplico nada. Dime adelante»* y un botón
**«Ejecutar plan (1)»** — **en autónomo**.

No fue una degradación: se midió que las tres puertas de `effectiveMode` estaban
abiertas (proyecto `trusted`, no es el repo propio, red git intacta). Es
deliberado, `lote-por-enter.ts:33`:

```ts
await sendMessage({ projectId, prompt, mode: 'supervisado', excludedAgents })
```

Y su docblock (`:16-19`) lo justifica bien: *«el turno lee, consulta el grafo y
propone, pero no toca un fichero — ni siquiera si el proyecto corre en
autonomo»*. **El plan en supervisado es correcto.** Lo que no lo es, en
autónomo, es **quién lo aprueba**.

El propio código nombra el hueco (`lote-por-enter.ts:21-26`):

> *«**PUNTO DE PARADA.** Aquí espera el APROBADOR del lote: hoy, en supervisado,
> es el OPERADOR […] **en la PIEZA 5 será OMEGA quien apruebe en autónomo, y
> entra JUSTO AQUÍ**. El flujo no cambia; solo cambia quién aprueba.»*

**Este ADR ocupa ese hueco.**

---

## 2. DECISIÓN 1 — El juicio del plan es NUEVO, y es un filtro SUAVE

### 2.1 Por qué no reusa `juzgar()`

Tres razones medidas, y la tercera es la de fondo.

**El input exige un diff** (`run-omega-inputs.ts:25-31`):

```ts
const files = await reads.changedFiles(worktreePath, baseSha)
const diffText = await reads.diffText(worktreePath)
```

Un plan no ha tocado nada: `files = []`, `diffText = ''`. El prompt saldría con
*«=== DIFF DEL FIX ===»* y nada debajo.

**El camino ya lo rechaza antes** (`juez-del-turno.ts:39`):

```ts
if (trabajo === null || trabajo.tocados.length === 0) return SIN_JUZGAR
```

**Y el vocabulario es del fix** (`omega-verdict.ts:8-17`):

| Eje | Sobre un plan |
|---|---|
| `resuelve_el_hallazgo` | aún no resuelve nada |
| `respeta_scope` / `respeta_doNotTouch` | quizá aplicables |
| **`calidad_del_diff`** | **no hay diff** |
| `riesgo_residual` | del fix, no de la dirección |

`computeGlobalVerdict` **deriva el veredicto de esos cinco** (D19). Forzar un
plan por ahí daría un `APROBADO` **computado sobre ejes que no midieron nada** —
un verde que no significa nada, que es la clase de fallo que ADR-091 existe para
impedir.

**Decisión: juicio propio, con su prompt y su vocabulario.** La pregunta es
*«¿es sensata esta dirección?»*, no *«¿este fix resuelve sin daño?»*. Dos
preguntas, dos momentos, el mismo juez.

### 2.2 Qué se le pasa

La **estructura** del hallazgo —`target`, `whatToChange`, `doNotTouch`— **más la
prosa del productor**. La estructura porque es lo único que no redacta el
modelo; la prosa porque es lo que hay que juzgar.

### 2.3 HONESTIDAD INNEGOCIABLE: es un cedazo, no una garantía

**El juicio del plan es un FILTRO DE DIRECCIÓN SUAVE. No es una garantía dura.**

OMEGA juzgaría *«voy a borrar el sink de `report.html` y ajustar el default de
pydantic»* — **una promesa, no un hecho**. No puede verificar que el plan sea
completo, ni honesto, ni ejecutable. **Un plan que dice lo correcto y luego hace
otra cosa pasa este cedazo entero** y solo se caza abajo, en el juicio del fix,
que sí mira hechos.

Eso no invalida el diseño: **el fix es la red dura y ya está construida y
probada** (§1.1). Pero obliga a decir la verdad en dos frases que no son la
misma:

> ✅ **«El autónomo verifica la dirección con OMEGA antes de ejecutar.»** Cierto.
>
> ❌ **«El autónomo garantiza que el plan es correcto.»** Falso.

Es la honestidad del `desconocida` (ADR-091 §2): **lo grave no es que un filtro
sea blando; lo grave es que se lea como duro.** Un cedazo que se presenta como
garantía es peor que no tenerlo, porque nadie mira debajo.

**Esta distinción es lo que se le promete a un cliente, y por eso va escrita.**

---

## 3. DECISIÓN 2 — El flujo del autónomo: OMEGA en la silla del aprobador

**En autónomo NO hay botón que espere al humano.**

```
el productor propone un plan
        ↓
UI: «Plan en verificación por OMEGA…»     ← el botón espera a OMEGA, no a Jojo
        ↓
OMEGA juzga la DIRECCIÓN
        ├── APRUEBA  → el turno prosigue SOLO → ejecuta
        │                    ↓
        │              y ahí entra el juicio del FIX, que YA funciona:
        │              productor → crítico → OMEGA sobre el diff (§1.1)
        │
        └── DENIEGA  → el productor repropone atendiendo la razón
                             ↓
                       vuelve a «Plan en verificación» → hasta aprobar
```

**El humano no desaparece de la seguridad: OMEGA ocupa su silla.** Desaparece de
la espera. *Motor propone, OMEGA dispone* en el plan; *motor propone, OMEGA
juzga* en el fix. **Dos aprobaciones, las dos automáticas.**

### 3.1 El debate al denegar NO es el tribunal

Y no hay que impedírselo: **ya se autoexcluye**. `tribunal-con-critico.ts`
arranca así:

```ts
const trabajo = cp.diff?.() ?? null
if (trabajo === null || trabajo.tocados.length === 0) return []
```

**El crítico ataca un diff, y un plan no lo tiene.** Sobre un plan devuelve lista
vacía **sin gastar un céntimo**. Que el tipo lo impida solo es mejor que una
regla que alguien tenga que recordar.

**El debate del plan es productor ↔ OMEGA**, con el molde que ya existe —
`veto-como-pedido.ts:13-21`:

> *«Tu cambio anterior fue REVISADO y VETADO. La objecion, literal: […] Corrige
> el fix atendiendo a ESA objecion concreta.»*

El mismo patrón sobre la dirección en vez de sobre el diff.

---

## 4. DECISIÓN 3 — La puerta de ejecución cerrada

### 4.1 Lo medido: el aprobador vive en el renderer, y el bucle también

| | |
|---|---|
| `lote-por-enter.ts:34` | `marcarPlaneado(projectId)` ← **aquí para** |
| `cola-del-lote-store.ts:14` | `planeado: boolean` — zustand, renderer |
| `BotonDelPlan.tsx:43` | el `onClick` → `resolverLotePendiente` |
| `cola-del-lote.ts:42-65` | **el bucle entero del lote**, en el renderer |

### 4.2 Por qué NO se baja el bucle

Dos razones, y la segunda es la que decide.

**Es caro:** `cola-del-lote.ts:42-65` es el `for` sobre los hallazgos, el corte,
el recuento y el parte. Mover eso es un arco propio.

**Y no daría la garantía.** Aunque el renderer preguntara a OMEGA por IPC,
**podría ignorar la respuesta** y llamar a `resolverLotePendiente` igual. La
garantía es sobre la **ejecución**, no sobre la pregunta. Bajar el aprobador sin
bajar la ejecución es mover la decisión y dejar la puerta abierta.

### 4.3 La decisión: que la EJECUCIÓN se niegue

**El main process rechaza un turno de lote en autónomo sin aprobación de
OMEGA**, en `chat-send-handler.ts:31`, junto a `guardRun`:

```ts
// Tope diario y concurrencia, comprobados ANTES de gastar.
const denegado = guardRun(context, input.projectId)
if (denegado !== null) return err(denegado)
```

**Gemelo de «sin red no se edita» (ADR-079).** El renderer puede pedir lo que
quiera; **sin aprobación, no corre**.

Y entonces **el aprobador puede seguir donde esté**, porque la garantía **no
depende de él**: depende de que la ejecución se niegue. Es la diferencia entre
confiar en que alguien pregunte y **hacer imposible no haber preguntado**.

### 4.4 Es la doctrina que esta sesión ya usó tres veces

| Garantía | Dónde vive | Por qué ahí |
|---|---|---|
| el recibo se tacha | `toRunInsert` (ADR-093 §3.4) | **todo INSERT pasa por ahí** |
| el crítico no se desarma | `AUDIT_AGENTS` (ADR-096 §12.3) | el repo no lo pisa |
| en rojo no se critica | la guarda de `arbitrar` (ADR-096) | lo que no se juzga no se critica |
| **sin aprobación no se ejecuta** | **`chat-send-handler`** | **todo turno pasa por ahí** |

**La defensa vive donde no se puede esquivar.** Una garantía sostenida por la
capa que pinta es una pared pintada — y este arco no va a construir la primera
de la Fase B.

### 4.5 Y el código ya razonó así

`cola-del-lote.ts:37-40`:

> *«En autonomo cada turno pasa por OMEGA antes de conservar y reintenta hasta
> converger, **asi que la cola ya no necesita un aprobador por hallazgo: lo tiene
> dentro**.»*

El aprobador **del fix** ya está dentro. **El del plan va igual: dentro, no en
quien llama.**

---

## 5. DECISIÓN 4 — El ciclo del plan es hermano, sin red

`hastaConverger` **no sirve**: su bucle vive dentro de `conRedDeReversion`, que
**abre un checkpoint y decide conservar o revertir**. Un turno de plan **no edita
nada** — meter el replan por ahí abriría **checkpoints vacíos en cada vuelta**,
sobre un árbol que nadie tocó.

**Decisión: bucle propio, sin red de reversión** —no hay nada que revertir— pero
**reusando la huella de convergencia**: si el segundo plan es igual que el
primero, el productor está dando vueltas y una vuelta más dará lo mismo.

Es el mismo criterio de ADR-096 §4.3 sobre otro objeto: **converger no es un
contador**.

---

## 6. DECISIÓN 5 — La UI va CON esto, no después

El ensayo lo dejó claro: **el autónomo funciona y es mudo**. Hacerlo visible no
es la pieza final del arco — **es la mitad del recibo**.

### 6.1 Tres estados, ninguno existe

| Estado | Color |
|---|---|
| «Plan en verificación por OMEGA…» | como *en curso* |
| «Debate · X agentes…» | **naranja** (`text-high`, ya existe) |
| «Consultando a OMEGA…» | **azul** (token nuevo) |

### 6.2 El contador existe y está APAGADO

`RunMeter.tsx:34`:

```ts
const fase = total === 0 ? 'preparando' : total > 1 ? `${step + 1}/${total} agentes` : ''
```

Y el turno con foco emite `total: 1` (`reply-from-chat.ts:59` y `:68`) **aunque
corran tres agentes** — productor, crítico y OMEGA. `total === 1` → `fase = ''`
→ **no se pinta nada**.

**Hay que emitir el total real.** El contador no se construye: se enciende.

### 6.3 El canal no llega donde hace falta

`step-progress.ts` → `chat-send-senders.ts:19` funciona, pero **`onStep` no llega
ni al juez** (`JuezDeps` tiene `context`, `projectId`, `cwd`, `omega` y nada más)
**ni al tribunal**. Hay que cablearlo.

### 6.4 El azul entra como TOKEN

Nunca escrito a mano —CLAUDE.md: *«Nunca colores hardcodeados. Siempre
tokens»*—, con el patrón de `graph-tones.ts:4-10`. Es una **etiqueta de proceso
efímera** y **no toca la identidad OMEGA**: el oro `hsl(38 85% 55%)` sigue siendo
la marca, como se decidió en ADR-096 §7.2.

> **El azul dice «OMEGA está ocupado en este instante». El oro dice «quién es
> OMEGA». No se pisan.**

---

## 7. Lo que NO está en este ADR

- **El paralelismo del tribunal** (N críticos por severidad, ADR-096 §11.2). El
  molde admite N; multiplicar viene **cuando ya se ve uno**.
- **Bajar el bucle del lote a `application`.** Medido como caro e insuficiente
  (§4.2). Si algún día se hace, será por otra razón, no por esta garantía.
- **Bash libre** (ADR-093 pieza 3): sigue bloqueada por ADR-092.

---

## 8. Alternativas consideradas

### 8.1 Que OMEGA juzgue el plan con el prompt del fix — RECHAZADA

Daría un `APROBADO` computado sobre `calidad_del_diff` de un diff vacío. **Un
verde que no midió nada** es peor que no juzgar: ADR-091 entero existe por eso.

### 8.2 Que el tribunal debata el plan — RECHAZADA, y ya se autoexcluye

El crítico ataca un diff. Sobre un plan devolvería lista vacía. Forzarlo sería
pagar N agentes que navegan para opinar sobre una promesa.

### 8.3 El renderer pregunta a OMEGA y decide — RECHAZADA

Es la barata, y es la que deja la garantía en la capa que pinta. El renderer
podría ignorar la denegación. **Sería la primera pared pintada de la Fase B**, y
esta sesión midió tres que ya lo eran.

### 8.4 Bajar el bucle entero del lote a `application` — DESCARTADA POR AHORA

Correcta en doctrina, cara, **y no resuelve el problema por sí sola**: mientras
la ejecución no se niegue, da igual dónde viva la pregunta. Si la puerta cerrada
del §4.3 resultara insuficiente, esta es la salida siguiente.

---

## 9. Consecuencias

**Buenas:**

- El autónomo **deja de pedir permiso** sin dejar de ser seguro: OMEGA ocupa la
  silla del aprobador.
- El debate **se ve**: lo que cuesta $1.93 y 6 minutos aparece en pantalla
  mientras ocurre.
- Se cierra el hueco que ADR-088 arco 1 dejó nombrado hace arcos.
- La garantía de ejecución pasa a vivir **donde no se puede esquivar**.

**Costes y riesgos asumidos:**

- **El juicio del plan es blando, y está dicho.** No se compensa con más
  vigilancia: se compensa con el juicio del fix, que ya existe.
- **Un turno más por hallazgo** —el juicio del plan— que antes no se pagaba. Es
  el precio de que el humano no espere.
- Encender el contador de agentes **cambiará lo que el operador ve en turnos que
  hoy no muestran nada**. Es el objetivo, no un efecto colateral.

---

## 10. Referencias verificadas

Contra el árbol vivo en `e53b2d0`, el 2026-09-18, y contra la base real donde se
indica.

| Referencia | Qué dice |
|---|---|
| *(medido en `agent_runs`)* | `critico` 395 s / $1.93 · `sentinel-omega` 71 s · el debate corrió |
| *(medido en `projects`)* | raisen-núcleo `trusted=1`, `CONFIGURADO`; modo `autonomo` |
| `src/presentation/services/lote-por-enter.ts:33` | el plan va forzado a `supervisado` |
| `src/presentation/services/lote-por-enter.ts:21-26` | el hueco del aprobador, ya nombrado |
| `src/presentation/services/lote-por-enter.ts:34` | `marcarPlaneado` — el punto de espera |
| `src/presentation/stores/cola-del-lote-store.ts:14` | `planeado: boolean`, en el renderer |
| `src/presentation/components/chat/BotonDelPlan.tsx:43` | el `onClick` que aprueba hoy |
| `src/presentation/services/cola-del-lote.ts:42-65` | el bucle del lote, en el renderer |
| `src/presentation/services/cola-del-lote.ts:37-40` | *«la cola no necesita un aprobador por hallazgo: lo tiene dentro»* |
| `src/infrastructure/ipc/chat-send-handler.ts:31` | `guardRun` — la puerta, antes de gastar |
| `src/application/repair/run-omega-inputs.ts:25-31` | el input de OMEGA exige un diff |
| `src/application/chat/juez-del-turno.ts:39` | sin ficheros tocados no se juzga |
| `src/domain/repair/omega-verdict.ts:8-17` | los cinco ejes, todos del fix |
| `src/domain/repair/omega-verdict.ts:21-33` | D19: el veredicto lo computa el código |
| `src/application/chat/tribunal-con-critico.ts` | el tribunal se autoexcluye sin diff |
| `src/domain/chat/veto-como-pedido.ts:13-21` | el molde de la réplica |
| `src/application/chat/ciclo-de-convergencia.ts:50-66` | el bucle del fix, dentro de la red |
| `src/presentation/components/chat/RunMeter.tsx:34` | el contador, apagado con `total === 1` |
| `src/application/chat/reply-from-chat.ts:59,68` | el turno con foco emite `total: 1` |
| `src/application/chat/juez-del-turno.ts:14-19` | `JuezDeps` sin `onStep` |
| `src/presentation/components/graph/graph-tones.ts:4-10` | el patrón `Record<estado, token>` |
| `src/domain/settings/modo-efectivo.ts:57-62` | las tres puertas, todas abiertas en el ensayo |

---

## 11. Relación con otras decisiones

- **Completa** ADR-096: la Fase B corre y ahora se ve.
- **Ocupa** el hueco de ADR-088 arco 1, que ya decía quién iría ahí.
- **Hereda** de ADR-091 la honestidad de nombrar un filtro blando como blando.
- **Aplica** la doctrina de ADR-079 a la aprobación: *sin red no se edita* →
  **sin aprobación no se ejecuta**.
- **Repite** la forma de ADR-093 §3.4 y ADR-096 §12.3: la defensa vive donde no
  se puede esquivar.
- **No toca** ADR-092 ni la Pieza 3 de ADR-093.
