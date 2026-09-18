# ADR-095 — El grafo solo responde del proyecto del turno, y los guardianes dejan de mentir

- **Estado**: Aceptada
- **Fecha**: 2026-09-18
- **Alcance**: aislamiento entre proyectos — el cruce que está abierto HOY, sin
  sandbox y con la correa puesta
- **Relación**: contención rápida **previa** a ADR-092 (el sandbox), que sigue
  siendo otro arco · no desbloquea la Pieza 3 de ADR-093
- **Nace de**: la auditoría de aislamiento del 18-sep, que midió que un agente
  trabajando en el proyecto B puede leer el proyecto A con una herramienta **ya
  concedida**, sin Bash y sin tocar el disco.

---

## Sobre el número

El siguiente hueco literal es **092**, pero está **reservado por tres documentos
firmados** para el sandbox (ADR-091 §5, ADR-093 §6 y su ENMIENDA 2). Y **094**
quedó **quemado a propósito** por la ENMIENDA 2 del ADR-093, que descartó «la
frontera de dueño» con su razón escrita para que nadie la reviva. Reusar
cualquiera de los dos haría que un lector futuro creyera estar leyendo otra cosa.
Este ADR toma el **095** y lo dice aquí para que la elección no parezca un
descuido.

---

## §0 — La ley aplicable

Este ADR **no afloja** nada de ADR-090 §0: no pone topes al agente ni le quita
capacidad. Acota **de qué proyecto puede hablar el grafo**, que es una frontera
—saber qué se hizo y dónde—, no un freno (ADR-090 §3).

El agente conserva la capacidad entera sobre **el proyecto del turno**. Lo único
que deja de poder es hablar de **otro**.

---

## 1. El cruce, medido en vivo

### 1.1 `list_projects` está pre-autorizada, en todos los modos

`graph-mcp.ts:22-40` la incluye en `GRAPH_READ_TOOLS`:

```ts
export const GRAPH_READ_TOOLS: readonly string[] = [
  'get_architecture', 'search_graph', 'trace_path', 'search_code',
  'get_code_snippet', 'query_graph',
  'list_projects',          // ← aquí
  'index_status', 'get_graph_schema', 'check_index_coverage', 'detect_changes'
].map((tool) => `mcp__${GRAPH_SERVER}__${tool}`)
```

Y `build-allowed-tools.ts:22-23` la concede **en los dos caminos**, lectura y
edición:

```ts
if (mode === 'lectura') return [...GRAPH_READ_TOOLS, ...READ_TOOLS]
return [...GRAPH_READ_TOOLS, ...selfVerifyRules(mode, trusted, scripts)]
```

### 1.2 Responde, y con más de lo que se cree

Llamada desde el `cwd` de `fortress-command-center`, devolvió **los cinco
proyectos con su ruta absoluta**. Por la vía `cli`, además: **rama actual,
`head_sha`, número de nodos y aristas, y tamaño** de cada uno.

```
/home/jojo/Escritorio/Raisen_FCC/fortress-command-center
/media/jojo/Jorge_Ibrain/APT BY
/media/jojo/Jorge_Ibrain/Health Flow V1_FINAL
/media/jojo/Jorge_Ibrain/Raisen Omega
/media/jojo/onn Disk/raisen-nucleo
```

### 1.3 El `cwd` no aísla: se direcciona por NOMBRE

El esquema de `search_code` exige `project` como parámetro **requerido**. La
consulta no mira dónde corre el agente: mira el nombre que le pasan. Lo mismo
`index_status`, `get_architecture` y las demás.

### 1.4 El docblock que decía que esto no podía pasar es FALSO

`graph-slug.ts:23-24`:

> *«Lo que NO tiene es red que lo desmienta — `list_projects` **no existe en el
> servidor v0.9.0**, aunque este comentario llego a prometerlo.»*

Existe, responde, y **está en la allowlist tres ficheros más allá**. Es la peor
clase de comentario: el que tranquiliza sobre justo el agujero que hay.

### 1.5 Por qué esto es lo primero, antes que cualquier otro hallazgo

La auditoría encontró más cosas —entornos sin acotar, escrituras fuera de la
caja, tablas globales—. **Este es el único que sangra hoy**: no necesita que
nada malicioso corra, ni Bash libre, ni un `postinstall`. Un agente con las
herramientas que FORTRESS **ya le concede** lee otro proyecto. Los demás son
potenciales; este es actual.

---

## 2. Por qué quitar `list_projects` NO basta

**La allowlist de Claude Code gobierna NOMBRES de herramienta, no argumentos.**
`--allowedTools mcp__codebase-memory__search_code` concede `search_code` entera,
con cualquier `project`.

Quitar `list_projects` impide **enumerar**. No impide **pedir**. Y el nombre de
otro proyecto no es un secreto: está en las rutas de los logs, en `fallos.log`,
en `projects.list()`, en el propio código, y es derivable de la ruta con
`graphSlug()` — una función que vive en este mismo repo. **Un agente que sepa
que existe «Health Flow» compone el slug y pregunta.**

La pared de verdad tiene que ser: **el grafo no puede responder de otro
proyecto, venga el nombre de donde venga.**

### 2.1 Lo que el servidor permite, medido

| Vía | Resultado |
|---|---|
| Bandera `--project` | **no existe** — `--help` solo ofrece `--ui`, `--port`, `--version` |
| Clave de configuración | **no existe** — `config list` da `auto_index`, `auto_index_limit`, `auto_watch`, `ui-lang` |
| `XDG_CACHE_HOME` | **ignorado** — devolvió los 5 proyectos igual |
| `HOME` | **SÍ lo honra** — con `HOME` vacío: *«cannot read cache directory: …/.cache/codebase-memory-mcp»* |

Y hoy FORTRESS lo lanza **sin argumentos** (`graph-mcp.ts:57`):

```ts
const GRAPH_MCP = { type: 'stdio', command: GRAPH_BIN, args: [] } as const
```

**`HOME` es la única palanca que el servidor respeta.**

---

## 3. LA DECISIÓN — aislamiento por construcción, no por regla

Dos piezas. La primera es barata e inmediata; la segunda es la pared.

### Pieza A — `list_projects` fuera de la allowlist

Sale de `GRAPH_READ_TOOLS`. Es **necesaria y no suficiente**, y el ADR lo dice
para que nadie la confunda con el arreglo.

Motivo propio, aparte de la pared: enumerar los proyectos del operador **no es
una capacidad que el agente necesite** para trabajar en el suyo. Quitarla no le
resta nada de su trabajo — no es un freno, es quitar una puerta que sobra.

### Pieza B — LA PARED: un `HOME` por turno con un solo grafo dentro

El grafo resuelve su cache como `$HOME/.cache/codebase-memory-mcp`. Si ese
directorio **solo contiene el `.db` del proyecto del turno**, entonces:

- `search_code(project: "otro")` **no encuentra nada que leer**;
- `list_projects`, si algún día volviera, **devolvería solo el proyecto activo**;
- y no hay regla que recordar aplicar: **el otro proyecto sencillamente no está
  ahí.**

Es la misma doctrina que ya se aplicó al recibo en ADR-093 §3.4 — **el tachado
vive en la última puerta porque así no hay camino que lo esquive**. Aquí:
el aislamiento vive en lo que el proceso **puede alcanzar**, no en lo que se le
pide que no haga. Seguridad por construcción, no por disciplina.

**Rechazo, no filtrado silencioso.** Cuando el grafo no encuentre el proyecto
pedido, el agente debe recibir un error explícito —no una lista vacía que se lea
como «ese proyecto no tiene ese código»—. Es la lección de `desconocida` en
ADR-091: **«no puedo» nunca debe leerse como «no hay».**

### 3.1 El problema que esta pieza tiene que resolver, dicho antes de construirla

**`HOME` no es solo la cache del grafo.** El CLI de Claude guarda ahí su
credencial OAuth y su historial (`~/.claude/`). Cambiar `HOME` a secas
**rompería el login y la facturación**.

Por tanto el `HOME` por turno **no puede estar vacío**: tiene que contener
- un enlace a la `~/.claude` real, para que auth y facturación sigan intactas;
- y un `.cache/codebase-memory-mcp/` con **solo** el `.db` del proyecto del turno.

**Esto es lo que hay que validar en construcción**, y es el riesgo real de este
ADR: que el CLI escriba en `HOME` algo más que no hayamos previsto. Se valida
con el gate y con un turno real antes de darlo por bueno. Si resultara
inviable, la alternativa considerada está en §7.2.

### 3.2 La validación obligatoria: QUÉ expone el enlace, no solo si el login vive

La Pieza B **mueve una pared**, y el enlace de compromiso podría abrir otra. Por
eso no basta con comprobar que el login sobrevive.

La auditoría del 18-sep midió que `~/.claude/` contiene, ahora mismo:
`history.jsonl`, `file-history`, `paste-cache` y `plans` — **transcripciones del
CLI con código de otros proyectos dentro**. Además de cientos de directorios de
sesión, uno por worktree de reparación.

Si el `HOME` por turno enlaza `~/.claude` **entero** para preservar el OAuth,
entonces el proceso del proyecto B **no leería el `.db` de A por el grafo, pero
leería el rastro de A por el historial del CLI**. Se habría cerrado la puerta y
dejado abierta la ventana de al lado — y peor, con la sensación de haber
cerrado.

**Obligatorio antes de escribir la primera línea de la Pieza B:** medir cuál es
el **mínimo enlazable** —qué necesita exactamente el login, y nada más— y
comprobar que el historial **no** entra en ese mínimo. El enlace expone
credenciales, no transcripciones.

**Si el login resultara necesitar más de lo que es seguro exponer, la Pieza B no
se escribe**: se pasa al plan B del §7.2. Esa decisión se toma con la medición
delante, no a mitad de la construcción.

---

## 4. Los tres guardianes pintados

Van **en este mismo arco** y no en otro, por una razón: **un test que miente es
peor que no tener test**. Los tres afirman una garantía que no dan, y los tres
se descubrieron en la misma auditoría.

### 4.1 `spawn-entorno-acotado.test.ts` — ciego por una regex

Su docblock promete: *«Ningún proceso hijo hereda la sesión viva del operador —
y la lista de quien spawnea se DERIVA, no se escribe.»* Su regex:

```js
const SPAWN = /\b(?:spawn|spawnSync|execFile)\(/g
```

Ejecutada contra cada forma:

```
execFileSync(    >>> CIEGO
execSync(        >>> CIEGO
execFile(        LO VE
spawn(           LO VE
```

**`execFileSync` no casa con `execFile\(`.** Consecuencia medida: cuatro
ejecuciones de `git` **con `cwd` en el repo vivo del operador** heredan
`process.env` entero —`SSH_AUTH_SOCK`, keyring, GPG, D-Bus incluidos— y el test
las declara inexistentes:

| Fichero | Qué ejecuta |
|---|---|
| `git-snapshot.ts:5` | `add -A`, `commit`, `reset --hard`, `rev-parse` |
| `head-sha.ts:9` | `rev-parse HEAD` |
| `is-ancestor.ts:15` | `merge-base --is-ancestor` |
| `push-handlers.ts:27` | `rev-parse --show-toplevel` |

**No pasan porque estén acotadas: pasan porque no se ven.** Y el docblock
presume haber cerrado la clase de error («enumerar a mano fue el error») justo
cuando la regex la reintroduce por otra vía.

**Decisión:** la regex cubre `execFileSync` y `execSync`, y el test **verifica el
entorno** de lo que caza, no solo que exista. Los cuatro `git` pasan a entorno
acotado.

### 4.2 `escribir-informe.ts:25` — no tacha, y su docblock sugiere que sí

`write-scan-log.ts:37` escribe la transcripción con `redactSecrets(texto)`.
`escribir-informe.ts:25` escribe el informe de auditoría **sin ninguna
redacción** — cero ocurrencias de `redactSecrets` o del cerco en ese camino.

Y su docblock (`:13`) dice: *«Mismo argumento, mismo sitio y mismo nombre por
`scanId` que la transcripcion.»* El sitio y el nombre sí; **el tratamiento no**.
La frase invita a leer una paridad que no existe.

**Decisión:** el informe se tacha como la transcripción, y el docblock dice
exactamente en qué se parecen y en qué no.

### 4.3 `graph-slug.ts:23-24` — el docblock falso del §1.4

**Decisión:** se corrige, y se deja anotado **que era falso**, no se reescribe en
silencio — la misma regla que ya siguen las enmiendas de los ADR.

---

## 5. La prueba: desde el ángulo del atacante

**Esta es la sección que el arco tiene por haber medido lo que midió.** Tres de
las paredes que creíamos tener estaban pintadas. Arreglarlas y volver a confiar
sin probarlo sería repetir el error exacto que acabamos de descubrir.

Regla para cada pared de este ADR: **no basta con que el test pase. Tiene que
FALLAR si la pared se cae.**

| Pared | Prueba desde el ángulo del atacante |
|---|---|
| El grafo | un agente en el proyecto B pide el grafo de A **por su nombre** y es **RECHAZADO**; y el rechazo se distingue de «no hay resultados» |
| `list_projects` | ya no está concedida en **ningún** modo — verificado sobre la lista real, no sobre la constante |
| El guardián de entornos | un `execFileSync` sin acotar, introducido a propósito en el test, **es cazado** |
| El informe | un secreto metido en un hallazgo **sale tachado** del `.md` |

El test del guardián se escribe de forma que **la regex anterior lo habría
dejado pasar**: es la única manera de demostrar que el arreglo arregla.

---

## 6. Lo que NO está en este ADR

- **El sandbox.** Sigue siendo **ADR-092**, otro arco, otro tamaño. Esto es
  contención de software sobre un cruce concreto; no encierra ningún proceso.
- **La Pieza 3 de ADR-093 (Bash libre).** **Este ADR no la desbloquea.** Cerrar
  el grafo no impide que un proceso lea el disco entero, que es lo que la
  bloquea. Se dice explícitamente para que nadie lea este arco como el permiso
  que falta.
- **Los otros hallazgos de la auditoría** — entornos de `buildEnv`, escrituras en
  `userData` y `/tmp`, las nueve tablas globales, el tope diario compartido, las
  colas globales. Quedan **anotados y sin resolver**, con su mapa, para el arco
  que los tome.

---

## 7. Alternativas consideradas

### 7.1 Solo quitar `list_projects` — RECHAZADA

Es la que parece suficiente y no lo es. Impide enumerar, no pedir; y el nombre
de otro proyecto es derivable con `graphSlug()`, una función de este repo. Sería
una pared que se salta quien sepa un nombre.

Se deja escrita **porque es la tentación obvia**: quien lea esto dentro de un año
y piense «con quitar la tool bastaba» debe encontrar aquí por qué no.

### 7.2 Un envoltorio propio del binario del grafo — CONSIDERADA, es el plan B

FORTRESS lanzaría un proceso propio que hable MCP, reenvíe al binario real y
**rechace toda llamada cuyo `project` no sea el del turno**. Ventaja: no toca
`HOME` ni el CLI. Coste: un servidor MCP propio que mantener, y un punto más
donde fallar en headless — donde el grafo ya demostró ser frágil.

**Es el plan B si el `HOME` por turno resulta inviable en construcción**, y se
decide entonces, no ahora. «Inviable» incluye el caso del §3.2: que el login
exija exponer más de lo que es seguro enlazar.

### 7.3 Pedir al servidor una bandera `--project` — DESCARTADA hoy

Sería lo correcto y no existe en `0.9.0` (medido). Depender de que un tercero la
añada dejaría el cruce abierto mientras tanto.

### 7.4 Apagar el grafo en proyectos ajenos — RECHAZADA

Quitaría capacidad real al agente para evitar un cruce que se puede cerrar sin
quitarla. Sería un **freno disfrazado** (ADR-090 §0): el agente perdería su
memoria del código por un problema que no es suyo.

---

## 8. Consecuencias

**Buenas:**

- El único cruce que sangra hoy deja de sangrar, **sin esperar al sandbox**.
- El agente **no pierde capacidad** sobre su propio proyecto: la conserva entera.
- Tres guardianes dejan de dar un verde que no corresponde. Un test que miente
  es deuda con intereses: se confía en él justo cuando más importa.
- El informe de auditoría deja de escribir secretos en claro en `userData`.

**Costes y riesgos asumidos:**

- **El `HOME` por turno es el riesgo real.** Toca la ruta por la que el CLI
  encuentra su credencial. Se valida con el gate y con un turno real antes de
  darlo por bueno; si falla, plan B (§7.2).
- El grafo ya demostró ser **frágil a cambios de configuración** (el fallo de
  `npx` en headless, que dejó el servidor con cero herramientas). Este cambio va
  por el mismo sitio y merece la misma desconfianza.
- Arreglar el guardián de entornos **hará aparecer trabajo**: cuatro `git` que
  hoy pasan van a empezar a fallar el test. Eso no es un efecto secundario, **es
  el objetivo**.

---

## 9. Referencias verificadas

Contra el árbol vivo en `8d57504`, el 2026-09-18, y contra el binario y el disco
reales donde se indica.

| Referencia | Qué dice |
|---|---|
| `src/domain/connectors/graph-mcp.ts:22-40` | `GRAPH_READ_TOOLS`, con `list_projects` en `:29` |
| `src/domain/connectors/graph-mcp.ts:57` | el servidor se lanza con `args: []` |
| `src/infrastructure/claude-code/build-allowed-tools.ts:22-23` | se conceden en los dos modos |
| `src/domain/graph/graph-slug.ts:23-24` | el docblock falso |
| `src/domain/graph/graph-slug.ts:26-31` | `graphSlug()` — el nombre es derivable |
| `src/infrastructure/graph/read-graph-index.ts:8` | la cache es `$HOME/.cache/codebase-memory-mcp` |
| `src/infrastructure/spawn-entorno-acotado.test.ts:23` | la regex ciega |
| `src/infrastructure/git/git-snapshot.ts:5` | `execFileSync` sin `env`, cwd del repo vivo |
| `src/infrastructure/git/head-sha.ts:9` | ídem |
| `src/infrastructure/git/is-ancestor.ts:15` | ídem |
| `src/infrastructure/ipc/push-handlers.ts:27` | ídem |
| `src/infrastructure/scan/write-scan-log.ts:37` | tacha con `redactSecrets` |
| `src/infrastructure/scan/escribir-informe.ts:25` | **no tacha** |
| `src/infrastructure/scan/escribir-informe.ts:13` | el docblock de la paridad falsa |
| *(medido en vivo)* `list_projects` | devuelve 5 proyectos con ruta absoluta |
| *(medido en vivo)* `--help` / `config list` | sin bandera ni clave de proyecto |
| *(medido en vivo)* `XDG_CACHE_HOME` | ignorado |
| *(medido en vivo)* `HOME` | honrado — «cannot read cache directory» |

---

## 10. Relación con otras decisiones

- **Aplica** ADR-090 §3: esto es una frontera, no un freno. El agente conserva
  su capacidad entera sobre el proyecto del turno.
- **Hereda la doctrina** de ADR-093 §3.4: la defensa vive donde no se puede
  esquivar, no donde hay que acordarse de llamarla.
- **Hereda la doctrina** de ADR-091: un «no puedo» nunca se lee como un «no
  hay».
- **No desbloquea** la Pieza 3 de ADR-093. Esa sigue esperando a ADR-092.
- **Precede** a ADR-092 sin sustituirlo: cierra un cruce concreto; el
  aislamiento del proceso sigue sin existir.
