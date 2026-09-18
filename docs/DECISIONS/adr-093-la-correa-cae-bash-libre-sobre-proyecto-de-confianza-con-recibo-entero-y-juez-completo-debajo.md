# ADR-093 — La correa cae: Bash libre sobre proyecto de confianza, con recibo entero y juez completo debajo

- **Estado**: Aceptada
- **Fecha**: 2026-09-18
- **Alcance**: Terminal (supervisado y autónomo) — lo que el agente PUEDE correr,
  y lo que queda escrito de lo que corrió
- **Relación**: cierra el trabajo que **ADR-091 §1 abrió y no cerró** (enmienda
  del 18-sep) · cierra la deuda del diff incompleto de **ADR-090 Fase A** ·
  mantiene la regla puente de **ADR-091 §5** hasta que exista **ADR-092**
- **Nace de**: la enmienda del 18-sep a ADR-091, que midió que la correa **sí
  existe** y que la LEY §0 **no se cumple en código**; y de medir, antes de
  quitarla, las dos capas que se daban por buenas y no lo eran.

---

## §0 — LA LEY

Dictada por el operador. Es la raíz de este ADR y no se negocia. Es la misma
de ADR-090 §0 y ADR-091 §0, copiada entera para que este documento se sostenga
solo.

> Todo proyecto que FORTRESS trabaja es de Jojo, de producción, de confianza.
> Un proyecto de confianza **NO lleva topes, frenos ni límites** — como se le
> quitaron a la página de Escaneo, que desde entonces da hallazgos más profundos,
> de grado bancario real. Aplica por igual a Terminal (supervisado y autónomo),
> LOOP y Motor.
>
> El Terminal tiene la **MISMA capacidad** que Jojo con `claude -p`: corre lo que
> necesite. Atar un agente Opus para que no haga lo que sabe hacer sería un
> **FRENO DISFRAZADO** (ADR-090 §0).

**Complemento — el recibo.** «Sin frenos» gobierna lo que el agente **puede
hacer**. **Saber qué corrió NO es un freno**: es la otra mitad del grado
bancario. Un banco deja la transacción hecha **y da el recibo**; si solo hiciera
una de las dos no sería un banco. El parte registra lo que corrió, nunca
silencio.

**Lo que este ADR añade a esa frase.** Hasta hoy el recibo se daba por existente.
No existe para comandos: existía **por accidente**, porque la correa lo
sustituía. Con tres comandos posibles, saber *«corrió Bash»* ya decía cuál. Al
caer la correa, esa equivalencia se rompe — y por eso el recibo se construye
**antes**, no después.

---

## 1. Contexto: el trabajo que ADR-091 abrió y no cerró

ADR-091 §1 afirmó que el Terminal ya corría `Bash` libre y `npm install`, y que
«no hay correa que quitar». **Era falso**, y el propio ADR-091 lo corrigió con
una enmienda visible y fechada el 18-sep (§1, *«ENMIENDA — 2026-09-18: el §1 se
equivocó. La correa SÍ existe»*):

> *«El agente intentó `npm ci --no-audit --no-fund`, dijo por pantalla «instalo
> dependencias para poder verificar», y el sandbox lo bloqueó. Sin
> `node_modules`, el gate quedó en `desconocida`.»*

Y su consecuencia, dicha allí sin suavizar:

> *«**Consecuencia sobre la LEY §0:** «el Terminal corre lo que necesite para
> preparar su terreno» **NO se cumple en código**. Es el freno disfrazado que la
> propia ley prohíbe, vivo. Este ADR lo daba por resuelto y no lo estaba: queda
> como **el trabajo que ADR-091 abrió y no cerró**.»*

**Este ADR es ese trabajo.**

### Por qué no se abre y ya

Antes de quitar la correa se midió qué había debajo. La tesis de partida era que
el riesgo ya estaba cubierto por cuatro capas: el checkpoint que revierte, el
gate honesto, el juicio de OMEGA y el recibo. **Dos de las cuatro no aguantaron
la medición**:

| Capa | Estado medido |
|---|---|
| Checkpoint que revierte | **Aguanta.** Probado en vivo el 18-sep |
| Gate honesto (`desconocida`) | **Aguanta.** ADR-091 §3 pieza 1, instalada |
| **El recibo** | **NO.** Registra el NOMBRE de la herramienta, no el comando |
| **El juicio de OMEGA** | **NO.** El diff no incluye los ficheros que el agente CREA |

Con la correa puesta, ninguno de los dos huecos importaba: tres comandos
posibles hacen del nombre un recibo suficiente, y un agente que solo corre
`npm run lint` crea pocos ficheros a espaldas del juez. **Al caer la correa los
dos huecos se abren a la vez**: un agente que puede correr cualquier cosa
(sin registro de qué) puede crear cualquier cosa (sin que el juez la mire).

Quitar la correa hoy no sería dejar al Ferrari sin freno de mano. Sería dejarlo
**sin cuentakilómetros**.

---

## 2. Por qué UN solo ADR y no tres

La decisión es **una**: *Bash libre es la ley*. Las piezas son **tres,
ordenadas**, y la última desbloquea la ley.

Se firma en un único documento **a propósito**. Si «el recibo» se firmara solo,
dentro de seis meses se leería como un fin en sí mismo — una mejora de
telemetría— y nadie entendería que existe **para poder abrir Bash con grado
bancario**. Peor: alguien podría instalar el recibo, no instalar Bash libre, y
dar el arco por cerrado, dejando la ley §0 incumplida con un documento firmado
encima diciendo que se hizo algo.

Un ADR, tres piezas, orden obligatorio. El documento dice la verdad entera:
**abrimos Bash libre, y estas dos piezas van primero porque sin ellas abrir
sería a ciegas.**

---

## 3. PIEZA 1 — El recibo de verdad

**Va primera. Sin ella, abrir es a ciegas.**

### 3.1 Estado medido: el recibo ya está construido, y se tira

El comando redactado **ya se computa hoy**. No hay que construirlo.

`tool-detail.ts:55-60` — para `Bash`, el detalle mostrable **es el comando, ya
tachado**:

```ts
const raw =
  name === 'Bash'
    ? input.command && redactSecrets(input.command)
    : (input.file_path ?? input.pattern ?? input.query ?? input.symbol ?? input.path)
```

`parse-assistant.ts:39` lo adjunta al evento del stream:

```ts
const detail = use ? toolDetail(use.name ?? '', use.input) : undefined
```

Y `run-accumulator.ts:35-41` lo **imprime en vivo y lo descarta**:

```ts
if (event.tool) {
  // Solo el NOMBRE se persiste; el detalle (ruta/comando redactado) va
  // por onChunk para leerse en vivo, pero nunca entra en `collected`.
  tools.push(event.tool)
  onChunk(`\n· ${event.tool}${event.detail ? ': ' + event.detail : ''}\n`)
}
```

**El comando redactado existe, ya computado, en la línea anterior a la que lo
descarta.** La pieza no es construir un recibo: es **dejar de tirar el que ya se
construye**.

Comprobación independiente, sobre la base real: las herramientas registradas del
turno del productor del 18-sep tienen **seis valores distintos** —`ToolSearch`,
`Bash`, `Read`, `mcp__codebase-memory__search_code`, `Edit`, `Write`— y ni un
solo comando. Con Bash libre, ese recibo diría *«Bash ×160»* y nada más. Es un
extracto bancario que dice «160 movimientos» sin importes ni destinatarios.

### 3.2 Decisión (a) — el recibo NO trunca cosméticamente

`tool-detail.ts:51` fija `const MAX = 120`, y `:63` corta con `'...'`.

**El problema no es que corte: es que MIENTE.** Enseña un fragmento con la forma
de un comando completo. Un `npm ci && node scripts/x.js && curl …` cortado a 120
esconde justamente la parte que importa — lo que vino después del comando
inocuo.

Es **exactamente la lección de `desconocida`** en ADR-091: lo grave no era no
saber; lo grave era que *«no lo sé»* se leyera como *«está bien»*. Un recibo
truncado con `...` mudo se lee como entero cuando no lo es.

**Decisión:**

- El recibo **persiste el comando completo**, sin tope cosmético.
- Existe un **techo forense alto** (del orden de KB, no de caracteres), muy por
  encima de cualquier comando real.
- Si ese techo se alcanza alguna vez, el recibo **lo dice** —«cortado a N
  caracteres»— y **nunca** pone un `'...'` mudo que finja completitud.
- **El vivo se queda con sus 120 y su `'...'`.** Ahí está bien: es texto para
  pintar, y quien lo mira está mirando.

**Dos usos, dos reglas** — el mismo patrón que ya se aplicó al separar `verde`
de `desconocida`: el límite de una vista no es la política de una auditoría.

### 3.3 Decisión (b) — columna propia, aditiva y nullable

`schema-agent-runs.ts:33` define hoy:

```
tools                 TEXT    NOT NULL DEFAULT '',
```

Es una **cadena unida por comas**. Meter pares nombre+comando ahí dentro ensucia
un campo que hoy es una lista simple, y muerde en cuanto haya que leer el recibo
sin parsear comas **dentro de comandos que llevan comas**.

**Decisión:** columna nueva, **aditiva y nullable**, siguiendo el patrón que el
propio esquema documenta en `schema-agent-runs.ts:5-11` para `usage_known` —
incluida la lección que ese docblock deja escrita:

> *«`usage_known` vive AQUI desde el segundo recambio (2026-09-11). Estaba fuera
> a proposito —el recambio copiaba con `INSERT ... SELECT *` y una columna de
> mas lo rompia— y esa decision hacia el recambio DE UN SOLO USO […] Se arreglo
> al reves: el recambio copia por NOMBRE, y esta constante vuelve a ser la unica
> verdad de como es la tabla.»*

La columna nueva va **en `AGENT_RUNS_COLUMNS`**, no por un `ALTER` suelto, o el
recambio de `expand-agent-runs-kind.ts` vuelve a ser de un solo uso.

**Un campo para el «qué herramientas», otro para el «qué comandos».** No se
mezclan.

### 3.4 Decisión (c) — INNEGOCIABLE (R1): se tacha ENTERO al persistir, para TODAS las herramientas

**Esta decisión no estaba prevista. La destapó medir la (b), y sin ella la
pieza 1 construiría el primer campo de FORTRESS que filtra secretos a disco.**

Hoy **solo `Bash` pasa por `redactSecrets`** (`tool-detail.ts:57-60`, arriba). El
`query` de un MCP, el `pattern` de un `Grep`, el `file_path` de un `Read` salen
**en crudo** — y el docblock lo dice sin esconderlo: *«Bash se redacta; el resto
es una ruta o un patron, seguro de ver»*.

Hoy eso **es** seguro — pero **no por `toolDetail`**. Es seguro porque el detalle
solo va al vivo, y el vivo está envuelto en `sinSecretosEnVivo`
(`chat-send-senders.ts:2`), que tacha el delta entero. **La protección la pone el
envoltorio, no el helper.**

Y el campo `tools` **no pasa por ninguna de las dos puertas**:

- `sinSecretosEnVivo` envuelve `onChunk`, no `tools`.
- `finish-turn.ts:42` tacha `outcome.text`, **no** `outcome.tools`:
  ```ts
  const texto = redactSecrets(outcome.text) + input.aviso
  ```

Hoy da igual: `tools` solo lleva nombres, y un nombre no puede llevar un secreto
pegado. **En el momento en que lleve comandos, `tools` sería el único campo
persistido de FORTRESS que no atraviesa ninguna redacción.** Un `Grep` con un
token en el patrón, o una query de MCP que arrastre una credencial, quedaría
escrito **en claro y para siempre** en la base del operador.

Eso es **R1 del CLAUDE.md raíz** («NUNCA loguees secrets en ningún output»), y es
**lo único de este arco que no se puede deshacer**: lo escrito, escrito está.

La doctrina ya existe y es innegociable (`innegociables-defensa.ts:72` protege
`en-vivo-tachado.ts`). Su propio docblock la enuncia:

> *«Por TROZO es lo unico que se puede hacer en vivo, y por eso NO basta […] de
> modo que lo que se GUARDA se tacha aparte y entero, en `finishTurn`. Uno
> protege la pantalla; el otro, lo que queda escrito para siempre.»*

**Decisión:** el recibo se tacha **al persistir, entero, y para TODAS las
herramientas** — no solo `Bash`. No es doctrina nueva: es la doctrina de
`en-vivo-tachado` aplicada a `tools`, que nunca la necesitó porque nunca llevó
nada que tachar. **Ahora lo llevará.**

Esta decisión es **innegociable**: ninguna de las otras dos piezas se instala si
esta no está puesta primero.

---

## 4. PIEZA 2 — El diff completo

**Cierra la grieta de la garantía de ADR-090.**

### 4.1 Lo medido

`trabajo-del-turno.ts:22-24`:

```ts
const diffText = git(cwd, ['diff'])
const listado = git(cwd, ['diff', '--name-only']).trim()
const tocados = listado === '' ? [] : listado.split('\n')
```

`git diff` y `git diff --name-only` **no ven los ficheros untracked**, por
definición. Un fichero que el agente **crea** no aparece ni en `tocados` ni en
`diffText`, así que **OMEGA no lo lee**.

No lo vio ningún test —los tests le daban a OMEGA un diff de mentira—. **Lo
encontró el propio juez**, en su primer contacto con datos reales (ADR-091 §1,
avistamientos del 18-sep 04:53 y 05:02):

> *«El DIFF DEL FIX solo mostró `vercel.json`, pero el worktree traía además un
> archivo NUEVO sin trackear que codifica la CSP como código.»*

**La garantía que ADR-090 promete —«OMEGA revisa EXACTAMENTE lo que el fix
tocó»— hoy es falsa**: revisa exactamente lo que el fix tocó *de lo ya
trackeado*.

### 4.2 Por qué es seguro, y por qué es pequeño

La preocupación razonable sería mezclar los ficheros nuevos **del agente** con
los que el operador tenía a medias sin trackear. **No ocurre**, y el código ya
depende de que no ocurra.

`git-snapshot.ts:32-33` — el checkpoint barre el árbol entero:

```ts
git(cwd, ['add', '-A'])
git(cwd, ['commit', '-m', message, '--allow-empty', '--no-verify'])
```

`checkpoint-transitorio.ts:40-46` lo documenta y lo usa:

> *«`gitSnapshot` comitea el arbol (`add -A`, `--allow-empty`): la unica forma de
> restaurarlo byte a byte, untracked incluidos. […] Al revertir, `clean -fd` es
> seguro: tras el `add -A` lo unico untracked es **suyo**.»*

**Invariante, por construcción: después del checkpoint, todo fichero untracked es
del agente.** No es una suposición de este ADR — es la condición de la que
`revertir()` ya depende para hacer `clean -fd` (`checkpoint-transitorio.ts:68`)
sin llevarse el trabajo del operador.

### 4.3 La ironía, anotada

**`revertir()` conoce los ficheros nuevos del agente: los borra. El juez no los
ve.**

Las dos mitades de la red de ADR-079 conocen al agente entero; **la que decide,
no**. OMEGA puede aprobar un turno cuyos ficheros nuevos nunca miró, y la vuelta
atrás puede borrar ficheros que nadie juzgó.

### 4.4 Decisión

Añadir `git ls-files --others --exclude-standard` a `leerTrabajo`
(`trabajo-del-turno.ts:20-30`) y unir su salida a `tocados`, apoyándose en el
invariante del §4.2.

**No toca innegociables.** El fichero protegido por
`red-adr079-protegida.test.ts` es `checkpoint-transitorio.ts` —que aquí no se
modifica—, no `trabajo-del-turno.ts`. El fichero tiene hoy 48 líneas: cabe bajo
el límite de 75 sin partirlo.

---

## 5. PIEZA 3 — Bash libre

**Va tercera, con las dos de arriba debajo.**

### 5.1 La correa, localizada

`safe-commands.ts`:

- `:9-13` — `VERIFY_SCRIPTS`: **tres intenciones y solo tres** (typecheck, lint,
  test).
- `:38` — la única regla que se construye:
  ```ts
  if (found !== null) rules.push(`Bash(npm run ${found})`)
  ```
- `:54` — y solo cuando:
  ```ts
  return mode === 'acceptEdits' && trusted ? safeCommandRules(scripts) : []
  ```

`npm install` y `npm ci` **no aparecen en ningún punto del camino del Terminal**
(ADR-091 §1, enmienda).

### 5.2 La correa argumenta a favor de su propia retirada

Su docblock (`safe-commands.ts:43-47`) dice por qué existe:

> *«El allowlist SOLO se pasa cuando el agente va a EDITAR de verdad
> (acceptEdits) Y el proyecto es de confianza. `npm run <script>` ejecuta lo que
> el package.json del **repo AUDITADO** defina; **en un repo no confiable eso
> seria ejecucion arbitraria**.»*

La correa se justifica **por los repos no confiables**. Bajo la LEY §0, todo
proyecto que FORTRESS trabaja es del operador, de producción, de confianza.

**No estamos rompiendo una decisión: estamos aplicando la que ya estaba escrita
al caso que ya estaba contemplado.** El código lleva su propio argumento dentro.

### 5.3 Decisión

Sobre proyecto de confianza y en el modo que ya habilita el allowlist, el
Terminal corre **lo que necesite** — `npm ci` y `npm install` incluidos—, con la
misma capacidad que el operador con `claude -p`.

Con el recibo de la Pieza 1 y el juez de la Pieza 2 **ya instalados**.

### 5.4 HILO NOMBRADO, NO RESUELTO: `trusted`

Bash libre cuelga de `trusted` (`safe-commands.ts:54`), que es **una de las tres
puertas** de `effectiveMode` (`modo-efectivo.ts:57`), junto con «no ser el repo
propio» y «red git» — según `terminal-puede-resolver.ts:15`:

> *«POR PROYECTO de `effectiveMode` —confianza, no ser el repo propio, red git—.»*

Existe **deuda abierta** sobre si `trusted` defiende de verdad. **Bash libre
hereda esa deuda.**

Este ADR **lo dice y no lo frena**: nombrarlo es la mitad honesta; resolverlo es
otro arco. Lo que no se admite es abrir sin dejarlo escrito, que es cómo un hilo
se convierte en un agujero.

---

## 6. REGLA PUENTE — se mantiene y se endurece

Vigente desde ADR-091 §5. **Innegociable hasta que exista ADR-092 (sandbox).**

- Sobre proyectos **del operador** (un solo dueño): **Bash libre total**, la ley
  §0 entera, en supervisado y en autónomo.
- Sobre código **de un cliente, en AUTÓNOMO**: **nada de Bash libre** hasta que
  exista el sandbox de ADR-092.
- En **SUPERVISADO**, con el operador delante: **cualquier proyecto** — el que
  mira es él.

**La razón, medida y nueva.** ADR-091 §5 la justificaba por el aislamiento
ausente (`gate-env.ts:32-36`: *«ACOTA EL ENTORNO, no encierra al proceso […] ve
el disco entero»*). A eso se añade ahora una segunda razón, del §3.1 de este
documento: **mientras el recibo siga ciego para comandos, la regla puente es lo
único que impide que el `postinstall` de un cliente corra —sin registro
reconstruible— en la máquina donde vive el código de otro.**

Con el recibo entero instalado (Pieza 1), esa segunda razón se extingue. **La
primera —el aislamiento— no**, y por eso la regla puente sigue en pie hasta
ADR-092.

Es una **frontera provisional, no un freno a la ley** (ADR-090 §3: un freno
limita lo que se puede hacer; una frontera es saber qué se hizo y dónde).

---

## 7. Lo que NO está en este ADR

- **El sandbox.** Es ADR-092, su propio arco. No se construye aquí.
- **Resolver la deuda de `trusted`.** Queda nombrada en §5.4, no resuelta.
- **Bash libre sobre código de cliente en autónomo.** Espera al ADR-092; hasta
  entonces rige la regla puente del §6.
- **Las Fases B y C de ADR-090** (debate por roles opuestos, paralelo por
  severidad). Este ADR no las adelanta ni las retrasa.

---

## 8. Alternativas consideradas

### 8.1 Abrir Bash libre primero, y construir recibo y diff después — RECHAZADA

Fue la propuesta inicial, y sonaba a la ley §0 en estado puro: *«quita la correa
ya»*. Se rechazó **al medir**, no al opinar.

Abrir primero no es «quitar la correa». Es quitar la correa **y apagar a la vez
las dos cosas que la hacían innecesaria**: con tres comandos posibles, el nombre
de la herramienta era un recibo suficiente y un agente que solo corre
`npm run lint` crea poco a espaldas del juez. Al abrir, ambas equivalencias se
rompen **el mismo día**.

El destino no cambió; cambió el orden. **Tercero sobre dos patas construidas, no
primero sobre el vacío.**

### 8.2 Tres ADRs separados — RECHAZADA

Ver §2. El riesgo es que «recibo» se lea en seis meses como un fin en sí mismo y
el arco se dé por cerrado con la ley §0 aún incumplida.

### 8.3 Heredar el truncado de 120 para el recibo — RECHAZADA

Es la política de un helper de UI. Heredarla como política forense es
exactamente la decisión-por-omisión que ADR-091 vino a matar. Ver §3.2.

### 8.4 Guardar el recibo dentro de `tools` — RECHAZADA

Ver §3.3 (parseo ambiguo) y §3.4 (el campo no atraviesa ninguna redacción; sería
una fuga R1).

### 8.5 Persistir `event.detail` tal cual, sin tachar — RECHAZADA, y es la peligrosa

Es la alternativa que **parecía** la implementación obvia de la Pieza 1: el
detalle ya existe, guárdalo. Habría construido un recibo que filtra secretos de
todas las herramientas que no son `Bash`. Ver §3.4.

Se deja escrita **precisamente porque era la obvia**: quien lea este ADR dentro
de un año y piense «esto era una línea» debe encontrar aquí por qué no lo era.

---

## 9. Consecuencias

**Buenas:**

- La LEY §0 pasa a **cumplirse en código** para el Terminal sobre proyectos del
  operador. El freno disfrazado que ADR-091 midió, muere.
- El recibo pasa a ser **de verdad**: qué se corrió, entero, tachado. La otra
  mitad del grado bancario deja de existir por accidente y pasa a existir por
  decisión.
- La garantía de ADR-090 —«OMEGA revisa exactamente lo que el fix tocó»— pasa a
  ser **cierta**.
- Cae una asimetría absurda: `revertir()` conocía al agente entero y el juez no.

**Costes y riesgos asumidos:**

- El recibo crece: se persiste texto por llamada de herramienta, donde antes
  había un nombre. Es el coste de tener extracto; se asume.
- **Bash libre hereda la deuda de `trusted`** (§5.4). Nombrada, no resuelta.
- La regla puente sigue siendo una **restricción real** sobre proyectos de
  clientes en autónomo, y lo seguirá siendo hasta ADR-092.
- El orden es **obligatorio**. Instalar la Pieza 3 sin la 1 y la 2 deja el
  sistema peor que hoy: un agente sin límites, sin registro de lo que corrió y
  con un juez que no ve lo que crea. **Este ADR se cumple entero o no se
  cumple.**

---

## 10. Referencias verificadas

Todas comprobadas contra el árbol vivo en `23ed3e6` el 2026-09-18. Las 23
primeras, antes de escribir el documento; las 6 últimas, en la auditoría de esta
misma tabla — que encontró **una cita rota**: `tool-detail.ts:63-65` en §3.2,
cuando el fichero tiene 64 líneas y el corte está solo en la `:63`. Corregida
antes de firmar. Se anota aquí porque una tabla de referencias que no dice qué
falló no es una verificación, es una lista.

| Referencia | Qué dice |
|---|---|
| `src/domain/chat/tool-detail.ts:51` | `const MAX = 120` — el truncado de UI |
| `src/domain/chat/tool-detail.ts:55-60` | solo `Bash` pasa por `redactSecrets` |
| `src/domain/chat/tool-detail.ts:63` | `flat.slice(0, MAX) + '...'` — el corte mudo |
| `src/infrastructure/claude-code/parse-assistant.ts:39` | `toolDetail(...)` → `detail` |
| `src/infrastructure/claude-code/run-accumulator.ts:35-41` | `tools.push(event.tool)` — solo el nombre |
| `src/application/chat/finish-turn.ts:42` | tacha `outcome.text`, no `outcome.tools` |
| `src/application/chat/en-vivo-tachado.ts` | la doctrina de las dos protecciones |
| `src/infrastructure/ipc/chat-send-senders.ts:2` | quien envuelve el vivo del chat |
| `src/domain/repair/innegociables-defensa.ts:72` | `en-vivo-tachado.ts` es innegociable |
| `src/infrastructure/persistence/schema-agent-runs.ts:5-11` | la lección de `usage_known` |
| `src/infrastructure/persistence/schema-agent-runs.ts:33` | `tools TEXT NOT NULL DEFAULT ''` |
| `src/infrastructure/persistence/expand-agent-runs-kind.ts:49-67` | el recambio que copia por NOMBRE |
| `src/infrastructure/git/trabajo-del-turno.ts:20-30` | `leerTrabajo`, 48 líneas, sin partir |
| `src/infrastructure/git/trabajo-del-turno.ts:22-24` | `git diff` / `--name-only`: sin untracked |
| `src/infrastructure/git/git-snapshot.ts:32-33` | `add -A` + commit: el barrido del checkpoint |
| `src/infrastructure/git/checkpoint-transitorio.ts:40-46` | el invariante «lo untracked es suyo» |
| `src/infrastructure/git/checkpoint-transitorio.ts:68` | `clean -fd`, que depende del invariante |
| `src/domain/repair/red-adr079-protegida.test.ts` | protege `checkpoint-transitorio.ts`, no el de al lado |
| `src/infrastructure/repair/gate-env.ts:28-30` | el `npm ci` corre `preinstall` del repo auditado |
| `src/infrastructure/repair/gate-env.ts:32-36` | «ACOTA EL ENTORNO, no encierra al proceso» |
| `src/domain/settings/safe-commands.ts:9-13` | las tres intenciones |
| `src/domain/settings/safe-commands.ts:38` | `Bash(npm run <script>)`, sin comodines |
| `src/domain/settings/safe-commands.ts:43-47` | «en un repo no confiable sería ejecución arbitraria» |
| `src/domain/settings/safe-commands.ts:54` | `acceptEdits && trusted` |
| `src/domain/settings/modo-efectivo.ts:57` | `effectiveMode` |
| `src/domain/settings/terminal-puede-resolver.ts:15` | las tres puertas por proyecto |
| `docs/DECISIONS/adr-091-…md:84-119` | la enmienda: la correa SÍ existe |
| `docs/DECISIONS/adr-091-…md:120-147` | la deuda del diff incompleto |
| `docs/DECISIONS/adr-091-…md:319-355` | §5 y la regla puente |

---

## 11. Relación con otras decisiones

- **Aplica** la LEY §0 de ADR-090, y su §3 (frenos vs. fronteras).
- **Cierra** el trabajo que ADR-091 §1 abrió y no cerró — la correa medida el
  18-sep.
- **Cierra** la deuda del diff incompleto anotada en ADR-091 §1, que cumple la
  garantía prometida por ADR-090 Fase A.
- **Hereda y endurece** la regla puente de ADR-091 §5, con una razón medida
  adicional (§6).
- **Delega** al ADR-092 el sandbox, y con él la caída de la regla puente.
- **Nombra sin resolver** la deuda de `trusted`, emparentada con la raíz A
  («trusted no defiende»).

---

## 12. Nota de procedencia

El voto inicial sobre las tres decisiones de este arco fue *«Bash libre total,
ya; recibo obligatorio; regla puente mantenida»*. Dos de esos tres votos se
corrigieron **midiendo**, no discutiendo:

1. *«Bash libre ya»* → **tercero**, al medir que el recibo era ciego
   (`run-accumulator.ts:39`) y el juez tuerto (`trabajo-del-turno.ts:22-24`).
2. *«Columna propia»* → **columna propia y tachada entera**, al medir que
   `tools` no atraviesa ninguna redacción (§3.4). El voto original, tal cual,
   habría construido una fuga R1.

Queda escrito porque es el patrón que este proyecto quiere: **cada vez que una
propuesta sonaba más a «sin frenos», medirla la hizo más segura sin traicionar la
ley.** Tachar el recibo no es un freno a lo que el agente hace; es la otra mitad
del grado bancario que el §0 exige. Un recibo que filtra secretos no sería grado
bancario: sería un troyano con extracto.

Es también, anticipado, el mecanismo de la **Fase B** de ADR-090 —roles opuestos
que discrepan y se corrigen— ocurriendo entre humanos y agentes antes de que la
Fase B exista en código.
