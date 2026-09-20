# Deudas medidas

**Fecha:** 2026-09-19 · **Commit de referencia:** `f2cc7f8`

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

## 4. Deudas estructurales

| deuda                                 | evidencia                                                                   | qué la desbloquea                                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADR-092 (el sandbox) sin escribir** | `adr-093:546-548,561` lo nombra como bloqueador                             | es el siguiente ADR; bloquea Bash libre (ADR-093 pieza 3)                                                                                            |
| **Verificación de stacks no-Node**    | el gate corre `npm`; un repo Python o Go no se verifica                     | ADR-092 + Bash libre. **No** un gate por lenguaje: sería mantener N gates                                                                            |
| **`sendMessage` saturado**            | 11 parámetros posicionales (`send-message.ts:23-36`)                        | rozada tres veces sin tocarla; se parte por costura cuando un arco la despierte de verdad                                                            |
| **`build-prompt.ts:6`**               | `'- NUNCA toques auth, pagos, RLS ni seguridad sin dejarlo escrito antes.'` | **medir primero**: dice «sin dejarlo escrito antes», no «vuelve a supervisado». Puede ser transparencia legítima o el freno de ADR-089 con otra ropa |

---

## 5. Dónde viven las deudas de FORTRESS sobre su propio código

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
