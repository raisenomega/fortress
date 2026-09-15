# ADR-088: El Terminal es grado bancario: resuelve cualquier hallazgo sin topes de reparación, y cierra en Historia

- **Fecha:** 2026-09-14
- **Estado:** Aceptada
- **Área:** Terminal · Ciclo de vida del hallazgo · Seguridad

## Alcance

**Este ADR decide SOLO sobre el Terminal del cliente**: la vista `chat`,
rotulada «Terminal» (la conversación, los workflows y la entrevista de
configuración, que comparten el agente de `buildChatEngines`).

Queda **fuera de alcance, explícitamente**:

- **El Motor de reparación en proyectos de cliente.** El Motor es de FORTRESS
  reparándose a sí misma; que hoy se pueda operar sobre repos ajenos es un arco
  futuro, con su propia decisión (deuda `motor-expuesto-en-proyectos-ajenos`).
  **Aquí no se cambia nada del Motor**: ni DEBUT, ni sus topes, ni sus frenos,
  ni su cola.
- **El loop de mailbd-main**, encendido hoy. No se toca aquí.
- **El Terminal sobre el repo propio.** Sigue en supervisado: los cambios en el
  código de FORTRESS pasan por el Motor, con firma (`SELF_REPO_SUPERVISED`).
- **Las degradaciones que no son de severidad.** Un proyecto sin confianza (el
  Terminal no ejecuta código ajeno sin ella) y un proyecto sin git (ADR-079: sin
  red no se escribe) siguen degradando a supervisado. Lo que cambia es que dejan
  de ser mudas (Decisión 5).
- **El paro de los workflows ante un CRITICAL** (`run-workflow.ts:65`). Queda
  como deuda (`workflow-del-terminal-para-en-critical`); no se decide aquí.

## Contexto

### La doctrina de los dos mundos

El 2026-09-14 el operador declaró la doctrina de producto (texto completo en
`internal/DOCTRINA-PRODUCTO.md`, fuera del repositorio público):

- **Mundo CLIENTE** — Escaneo · Terminal · Historial · Documentación ·
  Superficie externa · Configuración. Flujo: escaneo profundo → **el Terminal
  resuelve TODO, sin topes y sin límite por severidad** (CRITICAL y HIGH
  incluidos) → el hallazgo aterriza en Historia. **Nada se queda en Escaneo.**
- **Mundo FORTRESS-sobre-sí-misma** — Motor de reparación · Auto-mejora ·
  Génesis · Cognición. El Motor existe para que FORTRESS se repare **sin tocar su
  binario vivo**, y todos sus frenos (DEBUT, firma, `loopBlocked`, topes) existen
  por eso. **DEBUT es correcto en el Motor y no aplica al Terminal.**

La objeción «FORTRESS se queda a mitad en los críticos» miraba el Motor. El
cliente usa el Terminal. Este ADR hace que el Terminal cumpla lo que la doctrina
le pide.

### Lo que el Terminal hace hoy (medido en `main@4dc26e8`)

**Tres topes, y dos de ellos tiran trabajo pagado.**

| Tope | Dónde | Qué pasa al saltar |
|---|---|---|
| Reloj de 15 min | `TECHO_POR_DEFECTO` (`run-claude-process.ts:12`). `buildChatEngines` no pasa `techoMs`. | Solo manda SIGTERM. El turno sale `failed` |
| Por ejecución ($50 hoy, $3 por defecto) | `--max-budget-usd` (`claude-cli.ts:34`), global | El CLI cierra con `subtype != success` → `failed` (`stream-events.ts:55`) |
| Diario ($500 hoy) | `guardRun` → `topeDiarioAlcanzado` (`run-guard.ts:21-45`), global | Impide **empezar** un turno; nunca corta uno en curso |

Un turno autónomo va dentro de la red de ADR-079 (`con-red-de-reversion.ts`):
**cuando sale `failed` se revierte entero**. Así que el reloj y el tope por
ejecución no dejan un arreglo a medias: **lo tiran, ya pagado.**

**Un freno por severidad, secreto.** En autónomo, `effectiveMode`
(`modo-efectivo.ts`) degrada a supervisado si la **petición** nombra un área
protegida (`protected-areas.ts:9-13`: auth, login, sesión, contraseña, pago,
checkout, rls, permiso, política, seguridad, secreto, token, clave, cifrado…).
Supervisado es `--permission-mode plan` (`permission-mode.ts:25`): **no puede
escribir**. Tres defectos:

- Filtra por **palabras del prompt, no por ficheros**. «Limpia el código muerto»
  puede editar ficheros de auth sin freno, y «revisa la política de caché»
  degrada por error.
- Es **mudo**: `avisoDeDegradacion` solo avisa del repo propio y de la falta de
  git (`operation-mode.ts`).
- **No tiene salida**: no hay «aprobar y aplicar».

Un CRITICAL casi siempre vive en esas áreas, así que pedirlo por su nombre lo
deja en solo lectura. La regla viene del CLAUDE.md universal («en modo autónomo
NUNCA tocar auth, payments, RLS ni seguridad sin pasar a supervisado») y el
agente la lleva además en su propio prompt (`MODE_INSTRUCTION`,
`operation-mode.ts`). **La intención es legítima; la implementación estorba.**

**No sabe qué hallazgo resuelve.** El mensaje lleva `projectId`, `prompt`,
`mode` y `excludedAgents` (`send-message-types.ts`). Los hallazgos le llegan
como hasta 40 líneas de texto sin id (`known-findings.ts`). El único puente
desde Escaneo es «Preguntar al Terminal», un botón global que pide explicar.

**No cierra el ciclo.** El Terminal no escribe el ciclo de vida. Desde ADR-087
el reescaneo no extingue por ausencia (`domain/scan/ausencia.ts`), y Historia es
solo `EXTINCT` (`finding-historia-sql.ts`). Hoy, un arreglo hecho en el Terminal
deja el hallazgo `ACTIVE` en Escaneo. Cerrarlo exige tres pasos:

1. El operador lo marca a mano como arreglado.
2. Pulsa Verificar.
3. El analista, si prueba la ausencia, lo extingue.

**El modelo lo decide una palabra.** `routeToAgent` (`agent-router.ts`)
siempre elige un agente por palabras clave, y su modelo sale del catálogo
(ADR-078). «Bug» va a code-reviewer (Sonnet) y «limpia» a refactor-cleaner
(Haiku). **Un CRITICAL descrito como «bug» lo arregla Sonnet.**

**No tiene memoria.** Cada mensaje es un `claude -p` nuevo, sin `--resume`:
«propón» y después «aplícalo» son dos sesiones que no se conocen.

## Decisión

Seis piezas, **de la más barata a la más cara**. Cada una lleva su marca:
**Libre** si no toca ningún fichero de la lista innegociable, **Innegociable**
si la toca.

### 1. Sin techo de tiempo — *Libre*

El Terminal pasa a **`SIN_TECHO`, con el molde exacto del escaneo**.
`armar-escaneo.ts:39` pasa `SIN_TECHO` como sexto parámetro de
`createClaudeCodeAgent`; `buildChatEngines` (`chat-engines.ts:16-32`) hará lo
mismo. Cubre conversación, workflows y entrevista, porque comparten el agente.
Build, Génesis, los borradores de agente y los episodios de capacidad
**conservan sus 15 minutos**.

**La única red es Detener**, como en el escaneo: `chat:stop` → `cancelRun` →
`killChildrenOf`, con SIGTERM y SIGKILL a los 3 s (`child-registry.ts`). El
reloj solo mandaba SIGTERM, que un proceso colgado de verdad ignora.

Esto **enmienda la Enmienda 3 de ADR-082**, que escribió que el chat conservaba
su reloj. Ver su Enmienda 4.

### 2. El Terminal sabe qué hallazgo resuelve — *Libre*

- El mensaje del Terminal gana un **`findingId` opcional**
  (`SendMessageInput` y el canal `chat:send`, que lo valida en el main).
- Un turno con `findingId` es un **turno de resolución**. Su prompt lleva ese
  hallazgo **completo** (fichero, línea, tipo, símbolo, título y evidencia del
  escaneo) en lugar de la lista de 40.
- **«Resolver en Terminal»** es una acción de cada fila del tablero de Escaneo:
  abre el Terminal con el hallazgo fijado.
- El chat libre sigue existiendo, sin `findingId`, como hoy.

### 3. El cierre del ciclo, hasta Historia — *Libre*

**No se reusa (A) tal cual.** (A) es parte de la máquina de estados de las
propuestas del Motor, y ADR-087 (Decisión 3) prohíbe abrir propuestas que no
quieren reparar. Se reusan **sus dos piezas**, que ya existen:

1. **Marcar.** Al terminar un turno de resolución **verde** (la red de ADR-079
   lo conservó y hubo ediciones), el hallazgo pasa a `MITIGATED` con
   `markMitigatedFinding` (`dismiss-finding.ts:30`).
2. **Verificar.** Acto seguido se lanza `verificarMitigado` (ADR-087): un
   analista independiente, de solo lectura, que tiene que **probar** que el
   problema ya no está. Se lanza como corrida propia, cuando el turno suelta el
   carril.

**La nota del mitigado NO lleva sha.** El Terminal no hace commit: el checkpoint
transitorio se retira con `reset --soft` y deja las ediciones sin commit en el
árbol, para que el operador las revise y las integre. La nota cita **el turno**
(el id del mensaje del Terminal que lo cerró) y **los ficheros tocados** (los
`edits` del turno). Por ejemplo: *«arreglado por el Terminal · turno `<id>` ·
ficheros: `api/checkout.ts`, `api/checkout.test.ts`»*.

**`extinguido_por` gana el valor `terminal`.** Hoy solo admite `agente` y
`operador` (`extinguido-por.ts`). La verificación que dispara el Terminal
extingue con `terminal`, para que Historia diga con honestidad qué vía cerró el
hallazgo. La columna es `TEXT` sin restricción: basta con ampliar el vocabulario
del dominio y pasar el valor por la vía de verificación.

**Los tres desenlaces, y ninguno miente:**

| La verificación dice | El hallazgo | Dónde se ve |
|---|---|---|
| El problema ya no está, **con prueba** | `EXTINCT`, `juicio_obsoleto`, `extinguido_por = terminal` | **Historia** (clase «verificado») |
| No puede probar la ausencia | Sigue `MITIGATED`, con la nota **«arreglado por el Terminal, sin prueba»** | Escaneo, visible y re-verificable |
| El problema **sigue** | Vuelve a `ACTIVE` con el dictamen del analista | Escaneo, en la cola |

**«Todo aterriza en Historia» se afina con ADR-087.** Lo que no se puede probar
**no se manda a Historia fingiendo**: sería la mentira que ADR-065 y ADR-087
vinieron a impedir. Nada se queda en Escaneo **sin decir por qué**.

La verificación es la de ADR-087, que ya es un gesto del mundo cliente (su botón
vive en Escaneo). Que por dentro use el analista del motor no la convierte en
Motor: no propone, no integra y no pasa por DEBUT.

Se corrige también el texto del modal de mitigar (`ConfirmMitigado.tsx:45`):
dice que «lo confirma un escaneo», y desde ADR-087 lo confirma la verificación.

### 4. Opus fijo y memoria por hallazgo — *Libre*

> **Enmendada el 2026-09-15 (Enmienda 2): cambia el nivel, no la forma.** Sigue
> siendo UN productor fijo para el turno de resolución, sin reparto por
> palabras. Lo que cambia es «Opus» literal por una escalera de modelos
> autoactualizable: OMEGA en la cima y el productor un peldaño por debajo. El
> chat libre conserva el router. Ver la Enmienda 2.

- **Un turno de resolución corre siempre con Opus**, sin pasar por el reparto
  por palabras de `routeToAgent`. El chat libre conserva el router. Se decide
  **un modelo fijo para resolver**, no subir de nivel a cada agente del
  catálogo.
- **Memoria por hallazgo.** Se captura el `session_id` que el CLI emite en su
  stream y los siguientes turnos sobre ese mismo hallazgo se lanzan con
  `--resume`. Así «propón» y «aplícalo» son la misma conversación.
- **`--resume` se añade en `claude-code-agent.ts`, NO en `buildArgs`**:
  `claude-cli.ts` es innegociable, y esta pieza no lo necesita.

### 5. El freno de severidad se SUSTITUYE, no se elimina — *Innegociable*

> **Enmendada el 2026-09-14 (Enmienda 1): esta pieza se reescribe.** El juez es
> OMEGA con el modelo más alto disponible, el productor trabaja con plenas
> capacidades y la red escala con el riesgo del hallazgo (debate de varias
> rondas para lo complejo o sensible). La degradación por palabra que dejó la
> pieza 2 es andamio y muere aquí. Ver la Enmienda 1.

Quitarlo a pelo perdería su intención: un cambio que afloja un control de auth
**compila en verde**, y el typecheck de la red de ADR-079 no lo detectaría. Se
sustituye por un control que protege de verdad y no deja el turno sin salida:

1. **No se degrada por severidad.** Un turno autónomo que nombra un área
   protegida **edita**, dentro de la red de ADR-079, en lugar de caer a `plan`.
2. **Revisión del diff antes de conservar.** Cuando el turno toca terreno
   protegido, **antes de conservar el checkpoint**, un **revisor de seguridad
   Opus** lee el diff. Es independiente del agente que editó y trabaja en solo
   lectura. Si **aprueba**, el turno se conserva y sigue el cierre de la
   Decisión 3. Si **rechaza**, se revierte y el operador ve sus razones; el
   hallazgo no se marca. Si el revisor **no puede dictaminar** (falla, no
   arranca), se revierte: **falla cerrado**.
3. **La señal pasa a ser lo que el turno HIZO, no solo lo que se PIDIÓ.** Se
   revisa si la petición nombra un área protegida **o si alguno de los ficheros
   del diff la nombra en su ruta**. Esto cierra el falso negativo de hoy
   («limpia el código muerto» que toca auth sin que nadie mire).
4. **Ninguna degradación es muda.** Las que se quedan (proyecto sin confianza,
   sin git, repo propio) se anuncian siempre, con su porqué.
5. **`MODE_INSTRUCTION` cambia a la vez.** Si no, el agente se frenaría solo por
   su prompt, que hoy le ordena no tocar seguridad en autónomo.

Toca `protected-areas.ts` y `modo-efectivo.ts`, que son **innegociables**, y
este ADR es su autorización. `permission-mode.ts` y `safe-commands.ts` (también
innegociables) **no se tocan**: la traducción del modo y la allowlist no
cambian. El fichero nuevo que decida conservar o revertir según el revisor es
una defensa, así que **entra en la lista innegociable en el mismo commit que lo
crea**, no después (la regla que ADR-082 ya fijó para partir `scan-handlers`).

### 6. Dinero: fuera el tope por ejecución; el diario se queda como red de cartera

**Se quita el tope POR EJECUCIÓN del Terminal** — *Libre*. La doctrina dice que
el Terminal no lleva topes de reparación, y el dato dice que ese tope, al
saltar, revierte trabajo ya pagado. `buildChatEngines` pasará el presupuesto con
`perRun: 0`, y `buildArgs` omite `--max-budget-usd` cuando vale 0
(`claude-cli.ts:34`, que no se toca). El resto de caminos conservan su tope por
ejecución, **escaneo incluido**: ADR-082 Enm. 3 lo quiso así («el dinero se
acota, el tiempo no»). Para el Terminal esta decisión va más allá de ese molde,
y lo hace a propósito.

**Se queda el tope DIARIO, como única red de cartera del Terminal.** Es
cartera, no freno:

- no mira severidades;
- no corta ningún turno en curso;
- solo impide **empezar** otro cuando el gasto del día pasó la cifra que el
  operador fijó en Configuración.

Vive en `run-guard.ts`, **innegociable**. Esta decisión **lo deja como está** —el
Terminal sigue pasando por `guardRun`— y lo ratifica como la red de cartera del
Terminal. Por tratarse de un innegociable, aunque sea para no cambiarlo, queda
**ratificada con la firma del operador**.

#### Riesgo aceptado, escrito para que conste

Sin reloj (Decisión 1) y sin tope por ejecución, **un turno del Terminal que se
desboque puede gastar sin límite hasta que el operador pulse Detener.** El tope
diario no lo corta: solo impide empezar el siguiente. La red contra ese
accidente es la misma que ADR-082 Enm. 2 aceptó para el escaneo: **el operador,
que está delante**. El Terminal es interactivo por definición: se lanza y se
mira. Es decisión deliberada del operador, con cuenta Max y criterio propio. Se
escribe aquí porque un riesgo aceptado a sabiendas y anotado no es lo mismo que
un riesgo que nadie vio.

### Las seis piezas, de un vistazo

| # | Pieza | Ficheros principales | Marca |
|---|---|---|---|
| 1 | Sin techo de tiempo | `chat-engines.ts` (+ enmienda de ADR-082) | **Libre** |
| 2 | `findingId` + «Resolver en Terminal» | `send-message-types.ts`, handler de `chat:send`, `chat-prompt.ts`, acciones de fila de Escaneo | **Libre** |
| 3 | Cierre del ciclo hasta Historia | la vía del turno (`con-red-de-reversion.ts`), `dismiss-finding.ts`, `verificar-mitigado.ts`, `extinguido-por.ts`, `ConfirmMitigado.tsx` | **Libre** |
| 4 | Opus fijo + memoria por hallazgo — **enmendada por la Enmienda 2**: el nivel lo da una escalera autoactualizable, no «Opus» literal | `reply-from-chat.ts` / router, `claude-code-agent.ts` | **Libre** |
| 5 | Sustituir el freno de severidad — **reescrita por la Enmienda 1**: producir con plenas capacidades + red que escala con el riesgo | `protected-areas.ts`, `modo-efectivo.ts`, `operation-mode.ts`, revisor nuevo (entra en la lista) | **Innegociable** |
| 6 | Sin tope por ejecución; el diario, ratificado | `chat-engines.ts` (y `run-guard.ts` sin cambios) | Por ejecución: **Libre**. Diario: **Innegociable** (se ratifica, no se cambia) |

## Orden de construcción

| Fase | Piezas | Por qué en ese orden |
|---|---|---|
| **1** | **1 y 2** | Las más baratas y libres. Quitar el reloj deja de tirar trabajo pagado desde el primer día, y el `findingId` es la base de todo lo demás |
| **2** | **3 y 4** | El cierre necesita saber qué hallazgo se resolvió (pieza 2). Opus y la memoria hacen que el turno de resolución sea el que merece la pena cerrar |
| **3** | **5 y 6** | La 5 toca innegociables y lleva la pieza nueva más delicada, el revisor del diff. La 6 cierra el arco con el riesgo aceptado ya firmado |

Cada fase pasa el gate 5/5 y se integra con firma, como cualquier cambio.

## Enmienda 1 (2026-09-14): la red del Terminal — OMEGA y la escala por riesgo

Decisiones del operador, fijadas el 2026-09-14 con las piezas 1 y 2 ya
construidas. Deciden quién juzga el trabajo del Terminal y cuánta red lleva, y
**reescriben la pieza 5**. El resto del ADR sigue en pie.

### 1. OMEGA es el modelo más alto disponible, siempre por encima del que produce

- OMEGA corre con el **modelo más alto disponible**, declarado de forma que se
  actualice solo cuando salga uno nuevo (hoy, Fable 5). Y va **siempre por
  encima del agente que produce**: si el Terminal resuelve con Opus
  (Decisión 4), quien juzga no puede ser Opus.
- Es un **testigo desde afuera**: observa todo el código en trabajo, anota, y
  emite su juicio **con evidencia** (`archivo:línea`).
- Su carta queda intacta: **veta, nunca ejecuta ni aprueba a ciegas**.
  Evidencia o silencio: lo que no puede señalar en el código, no lo afirma.

**Pendiente antes de construir: la relación con ADR-078.** ADR-078 descartó
Fable «por doctrina, no por capacidad»: su respaldo ante una petición de
ciberseguridad cae a Opus 4.8 con retención de 30 días, y FORTRESS audita código
ajeno bajo cero telemetría. Esta decisión pone a OMEGA justo en ese caso:
juzgar diffs de seguridad de código de cliente. Antes de construir la pieza 5
hay que resolver esa tensión de forma explícita —comprobar el comportamiento
vigente o decidir qué garantía se afirma— y dejarlo escrito en ADR-078 o en el
ADR de la pieza 5. Esta enmienda no la resuelve: la registra.

### 2. La red escala con el riesgo del hallazgo

| Riesgo del hallazgo | Red |
|---|---|
| **Por defecto:** LOW y MEDIUM, y CRITICAL/HIGH simples | **Productor + juez.** Un agente escribe con plenas capacidades; el **gate objetivo** (typecheck, lint, test: no puede mentir) y **OMEGA** revisan el diff. Si los dos dan verde, el turno se conserva; si no, la red git (ADR-079) lo revierte. |
| **CRITICAL/HIGH complejos, o que tocan auth, pagos o secretos** | Se abre el **debate de varias rondas**: la defensa argumenta, OMEGA juzga, y gana quien sube el **score real**. La profundidad del juicio es proporcional al peligro. |

El **criterio** de cuándo se abre el debate queda declarado aquí. Su **forma
concreta** —cuántas rondas, cómo se mide «complejo», qué cuenta como score real—
la fija el ADR o la implementación de la pieza 5.

### 3. Paridad con `claude -p`

El agente que produce tiene **las mismas capacidades que Claude Code** en la
máquina del operador: leer el schema de la base de datos, mirar el despliegue,
tocar cualquier fichero, cuando esa capacidad exista. FORTRESS **no se limita
por debajo de su propio motor**. La misión es superar a Cursor y a Lovable, no
igualarlos.

### 4. Sin aprobación humana en el mundo cliente

El cliente no es técnico: da órdenes en lenguaje normal. La seguridad la ponen
**el gate, OMEGA y la red git que revierte**, **no un clic humano**. El humano
vuelve solo por **su propio git**, fuera de FORTRESS.

Esto es **mundo cliente (Terminal)**. En el mundo FORTRESS-sobre-sí-misma sigue
la **firma humana** del Motor, y esta enmienda no la toca.

### 5. La degradación por palabra es andamio temporal

El tapón que dejó la pieza 2 —un hallazgo sensible baja a `plan` porque el
texto que se juzga incluye su fichero, su título y su tipo (`textoParaElModo`)—
es **andamio temporal**. Protege el intervalo hasta la pieza 5 y **muere cuando
OMEGA revise el diff de verdad**. No es diseño final.

### Consecuencia: la pieza 5 se reescribe

De **«bloquear por palabra hasta tener revisor»** a **«producir con plenas
capacidades + una red de agentes que escala con el riesgo»**. La Decisión 5 y la
fila 5 de la tabla remiten aquí.

Lo que **cambia**: el juez es OMEGA con el modelo más alto, no «un revisor de
seguridad Opus»; el productor no se recorta; y para el riesgo alto el juicio es
un debate, no una lectura.

Lo que la Decisión 5 ya fijaba y **esta enmienda no contradice**: la revisión
mira lo que el turno HIZO (los ficheros del diff), no solo lo que se pidió;
ninguna degradación que se quede es muda; `MODE_INSTRUCTION` cambia a la vez; el
juez falla cerrado; y el fichero nuevo que decide conservar o revertir entra en
la lista innegociable en el mismo commit que lo crea. Si el ADR de la pieza 5
decide otra cosa sobre alguno de estos puntos, lo escribe allí.

## Enmienda 2 (2026-09-15): el productor del Terminal — escalera de modelos autoactualizable

Decisiones del operador, fijadas el 2026-09-15 con las piezas 1 a 3 ya
integradas y antes de construir la 4. Deciden **con qué nivel de modelo
produce** el turno de resolución y **cómo recuerda** entre mensajes.
**Enmiendan la Decisión 4.** El resto del ADR, y la Enmienda 1, siguen en pie.

### 1. Un productor fijo, con el nivel dado por una escalera

La Decisión 4 decía «Opus fijo» para el turno de resolución. Se sustituye por
**UN productor fijo**, que no se elige por palabra, cuyo **nivel de modelo lo da
una escalera autoactualizable**: **OMEGA en la cima y el productor un peldaño
por debajo**. Es la forma que toma la regla de la Enmienda 1 §1 («OMEGA siempre
por encima del que produce»), escrita una sola vez en lugar de repetida en cada
agente.

Autoactualizable en dos sentidos:

- Cada peldaño es un **alias**, no un id fijo (el molde de ADR-078): `opus`
  apunta siempre al último Opus sin tocar código.
- El productor **no se nombra, se deriva**: es el peldaño de debajo de la cima.
  Cuando la cima sube, el productor sube con ella sin tocar nada más.

### 2. Alcance: solo el turno con foco

Esto vale solo para el turno que **resuelve un hallazgo**, el que llega con
`findingId` (pieza 2). **El chat libre conserva `routeToAgent`**: en ese punto
la Decisión 4 sigue vigente tal como estaba. Los workflows, el escaneo, Build y
OMEGA no cambian ni de agente ni de modelo.

### 3. La escalera vive en un solo sitio, pendiente de ADR-078

La escalera es un **módulo puro del dominio**
(`src/domain/agent/escalera-de-modelos.ts`) con una constante, **`CIMA`**, que es
la **única fuente del nivel**. Ningún otro fichero nombra el modelo del
productor.

- **Default: `CIMA = 'fable'`.** El productor sale del peldaño de debajo:
  **`'opus'` hoy**.
- **PENDIENTE ADR-078.** El valor real de `CIMA` se confirma junto a la pieza 5,
  cuando se resuelva la deuda `omega-fable-choca-con-adr-078`. Esta enmienda no
  la resuelve, igual que la Enmienda 1: la registra.
- **Por qué ese default.** Con `'fable'`, el productor sale `'opus'`, que es
  igual o mejor que cualquier agente al que el reparto por palabras manda hoy el
  turno: Opus, Sonnet o Haiku, según las palabras del título y de la ruta. Con
  `'opus'`, el productor caería a `'sonnet'`, una **bajada** que no se quiere
  introducir mientras se decide Fable.
- **Esta pieza no hace correr nada con Fable.** `CIMA` solo fija el peldaño del
  productor. OMEGA sigue con el modelo que declara hoy su catálogo
  (`sentinel-omega.ts`) hasta la pieza 5, así que la tensión de ADR-078 no se
  toca todavía.

### 4. Transitorio hasta la pieza 5: productor y OMEGA coinciden

Mientras OMEGA siga en `'opus'`, **el productor y OMEGA corren con el mismo
modelo.** Es **inocuo**: OMEGA todavía no juzga los diffs del Terminal. Eso
llega con la pieza 5, que es también la que conecta `CIMA` con OMEGA. **No es
diseño final**: es el intervalo entre dos piezas, dicho aquí para que no
parezca un descuido.

### 5. La identidad del productor

- Es un **agente nuevo del catálogo** y viaja por `--agents`, como el resto del
  reparto de ADR-078: su modelo va en su definición. No se añade `--model`, que
  sería un flag nuevo fuera de `buildArgs`. Así el turno lleva un agente con
  nombre, visible en el chip, en la telemetría y para OMEGA.
- **Está protegido en `AUDIT_AGENTS`** (`agents-for-project.ts`): un
  `.claude/agents/*.md` del repositorio del cliente **no puede reescribir su
  modelo ni su prompt**. Sin eso, un fichero del repo auditado decidiría con qué
  nivel se arregla su propio código, y la escalera dejaría de ser la única
  fuente.
- **Se trata aparte en `AgentPanel`**: no es un interruptor del operador.
  Apagarlo dejaría el turno de resolución sin productor, y la exclusión de
  agentes del sidebar no le aplica.

### 6. Memoria por hallazgo, con dos garantías

El productor **recuerda entre mensajes sobre el MISMO hallazgo** (`--resume`),
de modo que «propón» y «aplícalo» son la misma conversación. El `session_id`
que emite el CLI se guarda con el hallazgo, en una columna nueva y aditiva de
`findings` sin DEFAULT (NULL es «sin memoria»), y el siguiente turno con ese
foco la reanuda. El chat libre no tiene memoria: sin hallazgo no hay a qué
atarla.

- **La sesión solo avanza si la red NO revirtió el turno.** Si ADR-079 deshizo
  las ediciones, el productor no puede recordarlas como hechas: la memoria
  guardada se queda en el último turno que sí se conservó.
- **Si `--resume` falla** (la sesión se borró o el proyecto se movió), se limpia
  y el turno arranca con una sesión nueva. Una memoria rota nunca bloquea
  resolver.
- **`--resume` va en `claude-code-agent.ts`, NUNCA en `buildArgs`**:
  `claude-cli.ts` es innegociable, y esta pieza sigue sin necesitarlo.

### Consecuencia: la Decisión 4 remite aquí

La Decisión 4 y su fila de la tabla remiten a esta enmienda.

Lo que **no cambia** de la Decisión 4: sigue siendo **UN productor fijo para el
turno de resolución**, sin reparto por palabras, con memoria por hallazgo y con
`--resume` fuera de `buildArgs`. Lo que **cambia** es que «Opus» literal pasa a
ser **el peldaño de debajo de la cima de una escalera autoactualizable**, con
`CIMA` pendiente de ADR-078.

## Consecuencias

- **El cliente resuelve CRITICAL y HIGH por el Terminal**, y el hallazgo
  aterriza en Historia sin los tres pasos manuales de hoy: un clic en «Resolver
  en Terminal», y opcionalmente revisar el diff antes de hacer commit.
- **Historia gana un cuarto quién**, `terminal`, además de `agente`, `operador`
  y «no consta».
- **Escaneo deja de ser un sitio donde las cosas se quedan en silencio.** Lo que
  sigue ahí dice por qué: vivo en la cola, o arreglado sin prueba.
- **El coste de resolver no está medido.** Un turno de resolución Opus, más la
  revisión del diff cuando toca terreno protegido (del orden de la de OMEGA,
  unos $0,50), más la verificación (unos $2,30). Se mide con las primeras
  resoluciones reales, como se midieron los $23,29 por fix del Motor, y se
  anota.
- **Un turno sin reloj y sin tope por ejecución puede gastar hasta Detener.** Es
  el riesgo aceptado de la Decisión 6.
- **Innegociables.** Se tocan `protected-areas.ts` y `modo-efectivo.ts` (fase
  3), y entra en la lista el revisor nuevo. `run-guard.ts` y `claude-cli.ts`
  **no se tocan**.
- **El Motor no cambia.** DEBUT, sus topes, su cola y su presencia en proyectos
  de cliente siguen como están hasta su propio arco.
- **ADR-082 queda enmendado** (Enmienda 4): el Terminal ya no conserva su reloj.

## Alternativas descartadas

**Quitar el freno de severidad sin sustituto.** Cumple la letra de la doctrina y
pierde su intención: un cambio que debilita la seguridad compila en verde, y
nadie lo miraría antes de conservarlo.

**Mantener el freno por palabras y añadir un botón «aprobar y aplicar».** Sigue
filtrando por palabras (falsos negativos y positivos) y necesita la memoria de
la pieza 4 para que «aplicar» sepa qué se propuso. El revisor Opus del diff mira
lo que se hizo, que es lo que importa.

**Reusar (A) creando una propuesta por cada turno del Terminal.** Daría el cierre
gratis, pero llenaría la lista de firma de propuestas que nunca quisieron pasar
por el Motor: la misma mentira sobre la intención que ADR-087 (Decisión 3)
descartó para la verificación.

**Mandar a Historia lo que no se pudo probar.** Cumpliría «todo aterriza en
Historia» al pie de la letra, pero repetiría la mentira que ADR-065 y ADR-087
existen para impedir: una pantalla diciendo que alguien comprobó lo que nadie
comprobó.

**Citar un sha en la nota haciendo commit en cada turno.** Rompería el diseño de
ADR-079 (el checkpoint es transitorio y se retira) y le quitaría al operador el
commit, que es donde revisa y decide. El turno y los ficheros bastan para
encontrar el arreglo.

**Subir de nivel a todo el catálogo de agentes.** Encarece todo, incluido el
chat casual, para arreglar solo un caso: el turno de resolución, que es el que
lleva el modelo fijo.

**Quitar también el tope diario.** Es la única red de cartera que queda, no
impide resolver ningún hallazgo y el operador la ajusta. Se queda.

## Código

Ninguno todavía: esta decisión precede a su implementación. El arco tocará,
por fases:

- **Fase 1:** `src/infrastructure/ipc/chat-engines.ts` ·
  `src/application/chat/send-message-types.ts` ·
  `src/infrastructure/ipc/chat-send-handler.ts` · `src/domain/chat/chat-prompt.ts`
  · `src/application/chat/known-findings.ts` · las acciones de fila de
  `src/presentation/components/scan/`.
- **Fase 2:** `src/application/chat/con-red-de-reversion.ts` (o quien lo envuelva)
  · `src/application/scan/dismiss-finding.ts` ·
  `src/application/repair/verificar-mitigado.ts` ·
  `src/domain/project/extinguido-por.ts` ·
  `src/presentation/components/scan/ConfirmMitigado.tsx` ·
  `src/application/chat/reply-from-chat.ts` ·
  `src/infrastructure/claude-code/claude-code-agent.ts`.
- **Fase 3:** `src/domain/settings/protected-areas.ts` *(innegociable)* ·
  `src/domain/settings/modo-efectivo.ts` *(innegociable)* ·
  `src/domain/settings/operation-mode.ts` · el revisor nuevo (entra en
  `innegociables-defensa.ts` en el mismo commit) ·
  `src/infrastructure/ipc/chat-engines.ts`.

## Referencias

- `internal/DOCTRINA-PRODUCTO.md` — la doctrina de los dos mundos (fuera del
  repositorio público).
- [ADR-065](adr-065-nada-muere-sin-juicio.md) — nada muere sin juicio: por qué lo
  no probado no va a Historia.
- [ADR-078](adr-078-modelo-por-agente-via-agents.md) — modelo por agente: el
  reparto que el turno de resolución deja de usar.
- [ADR-079](adr-079-editar-el-arbol-vivo-exige-red-de-reversion.md) — la red de
  reversión dentro de la que edita el Terminal.
- [ADR-082](adr-082-escaneo-por-paradas-con-cobertura-declarada.md) — el molde
  del escaneo (Enmiendas 2 y 3) y su Enmienda 4, que nace de este ADR.
- [ADR-087](adr-087-confirmar-un-hallazgo-exige-juicio.md) — la verificación y
  la Historia que cierran el ciclo del Terminal.
