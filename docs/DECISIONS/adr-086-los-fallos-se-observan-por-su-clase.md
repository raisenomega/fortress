# ADR-086: Los fallos de la app se observan por su CLASE, nunca por su mensaje

- **Fecha:** 2026-09-11
- **Estado:** Aceptada
- **Área:** Auto-mejora · Confidencialidad del cliente · Robustez

## Contexto

### El Nivel 1 cerró, y se probó solo

[ADR-085](adr-085-todo-agente-observa-y-nada-filtra.md) fijó la ley —todo agente
observa a FORTRESS, y ninguna observación filtra al cliente— y dejó tres niveles
escritos como norte. El **Nivel 1** (los agentes observan sus límites) está
completo: cuatro emisores, el cerco de cuatro reglas, el vocabulario cerrado de
`area` y el dedup por proyectos distintos. Y se verificó **en vivo**: la primera
observación nacida de un `denial` real apareció sola en la base del operador,
sin que nadie la escribiera a mano.

Este ADR es el **Nivel 2**: los fallos. No un agente que choca con un límite,
sino la app que **revienta**.

### Un fallo hoy no deja rastro

Medido sobre `src/` el 2026-09-11, sin contar tests:

| medida | valor |
|---|---|
| bloques `catch` en producción | **161** |
| `console.error` | **20** |
| `ipcMain.handle` sueltos | **110** |
| wrapper común de IPC | **0** |
| reportador de errores | **0** |
| `uncaughtException` / `unhandledRejection` | **0** |
| `ErrorBoundary` / `componentDidCatch` / `window.onerror` | **0** |

`reportError` existe, pero sale de `toast-store`: es una notificación de UI.
Pinta un aviso y muere. De los 161 `catch`, veinte llegan a `console.error` —que
en un AppImage va a un stdout que nadie lee— y los otros 141 manejan y olvidan.

Y esos veinte son justo los interesantes: `[motor] no se pudo asentar la
corrida`, `[scan] no se pudo asentar la aplicabilidad`, `[ADR-084] el backfill de
identidades NO corrió`, `[ADR-085] no se pudieron asentar las observaciones`.
Son la red de «mejor esfuerzo CON constancia» que cada arco fue dejando.
**Dicen la verdad, y no la guarda nadie.**

El proceso principal arranca con `app.whenReady().then(...)` **sin `.catch`**: si
`registerIpcHandlers()` o las migraciones lanzan, la promesa se rechaza en
silencio y la app queda a medio arrancar sin que nada lo diga.

### La señal ya está en el código, y es minúscula

No hay que inventar el criterio de «qué merece observarse». El código ya separa
señal de ruido, y lo dice en su propio docblock:

> *«Resultado explícito en vez de excepciones: cruza el puente IPC sin perder
> información (una excepción llega al renderer como un string opaco).»*
> — `src/domain/shared/result.ts`

| forma | usos | qué significa |
|---|---|---|
| `err(...)` | **156** | fallo **esperado**: viaja como valor, alguien lo maneja |
| `throw new Error` | **7** | **inesperado**: «esto no debería pasar» |

Los siete `throw`, uno por uno: la red del recambio de tablas (`recambio-tabla`,
`expand-agent-runs-kind`), el libro de eventos fuera de orden
(`sqlite-proposal-event-repository`), una fusión sin severidades
(`severidad-al-fundir` — su comentario dice literalmente *«es un fallo de
cableado, no un caso de datos»*), el puente del preload ausente
(`fortress-api`), el nodo `#root` que no aparece (`main.tsx`) y un fixture.

Un `err()` es la app **funcionando**: un proyecto duplicado, una carpeta que no
existe, un fichero que falta. Capturarlos sería llenar el backlog de uso normal.

### El mensaje NO es seguro por construcción

Ésta es la diferencia que separa el Nivel 2 del Nivel 1, y la que decide todo lo
demás.

En el Nivel 1 la confidencialidad salió **gratis**: el `tool_name` de un denial
es `Bash`, `Read`, `mcp__codebase-memory__query_graph`. Un nombre de herramienta
**no puede** contener nada del cliente, y por eso el chat observa sin pasar por
el cerco. Seguro por construcción.

Un `message` no. Medido:

| medida | valor |
|---|---|
| `err(` con plantilla interpolada | **13 de 13** |
| `throw new Error` con plantilla interpolada | **4 de 4** |
| de esos 17, los que concatenan una ruta o una identidad del cliente | **8** |

```
err(`Ese proyecto ya esta en FORTRESS: ${path}`)                 ← ruta del cliente
err(`La carpeta donde quieres crearlo no existe: ${parentDir}`)  ← ruta
err(`Ya hay un archivo con esa ruta: ${target}`)                 ← ruta
throw new Error(`fusion sin severidades: ${fusion.identidad}`)   ← fichero│línea│tipo del cliente
```

Podría objetarse que hoy **sólo uno** de los siete `throw` lleva dato del
cliente, y es cierto. Pero eso es un accidente del código de hoy, no una
garantía: quien escribe el `throw` número ocho decide qué concatena, y hay 161
sitios que pueden empezar a propagar un error ajeno mañana. **Una auditoría de
siete sitios no es una garantía** — la misma lección que en ADR-085 obligó a
poner el cerco en vez de pedirle a cada agente que no citara.

## Decisión

### 1. Tres embudos, porque no existe ninguno

El Nivel 1 tuvo suerte dos veces: `add` y `finishTurn` ya existían como puntos
por donde pasaba todo el mundo. Aquí no hay ninguno, y la doctrina del
cuello de botella dice que la garantía se pone donde **todos** pasan, nunca en
cada llamador —lección de los seis agentes que no asentaban su corrida—.

| embudo | qué atrapa | fichero | estado |
|---|---|---|---|
| **(a) proceso principal** | `uncaughtException` y `unhandledRejection` | `src/main/index.ts` | **libre — va ahora** |
| **(b) IPC** | lo que lance cualquiera de los 110 handlers | envoltorio común | **libre — va ahora** |
| **(c) renderer** | lo que rompa un componente | `ErrorBoundary` en `presentation/` | **componente ahora; enganche, después** |

El (c) se parte en dos a propósito. El **componente** vive en `presentation/` y
es libre: se construye y se prueba ahora. El **enganche** —hacer llegar el fallo
del renderer al proceso principal— cruza `src/preload/index.ts` y
`src/infrastructure/electron/**`, ambos **innegociables**. Queda construido y
desconectado, y se activa con firma del operador: un gesto pequeño, no un arco.

### 2. Se captura lo inesperado, no el uso normal

Los embudos observan **`throw` y promesas rechazadas sin manejar**. Los `err()`
**no se capturan**: son la app funcionando.

### 3. Se guarda la CLASE del fallo, no su mensaje

**Éste es el contrato nuevo, y es el corazón del ADR.** La observación se compone
de tres datos, y los tres son seguros **por construcción**, igual que el
`tool_name` del Nivel 1:

| dato | de dónde sale | por qué es seguro |
|---|---|---|
| **dónde** | el canal IPC (`projects:register`), o el embudo (`arranque`) | es una constante del código de FORTRESS |
| **qué tipo** | `error.name` (`Error`, `TypeError`, `SqliteError`) | es un nombre de clase, no un valor |
| **qué operación** | el paso que corría | lo fija FORTRESS, no el dato de entrada |

*«Falló la migración de identidades al arrancar»* es útil, accionable, y no
lleva ni una ruta del cliente. El `message` crudo sí la llevaría.

**El `message` no entra en la observación.** Va al log local del operador, que
no viaja a ningún sitio. Son **las dos lecturas** que el Nivel 1 ya estrenó en
`lectura-del-denial.ts`: `describeDenial` le da al operador el comando completo,
`nombreDeHerramienta` le da a FORTRESS lo único que puede aprender sin filtrar.
Mismo molde, misma frontera.

Y la red sigue puesta debajo: `asentar` redacta **todo** lo que entra, venga de
donde venga. Si algún día un embudo dejara colarse texto, seguiría pasando por
el cerco de ADR-085 antes de tocar la base.

### 4. Vocabulario: tres áreas provisionales, derivadas del código

`AREAS_DE_OBSERVACION` habla de **límites que un agente encuentra** (permisos,
grafo, hallazgo). Un fallo es otra cosa: no es que a FORTRESS le falte una
capacidad, es que se rompió. Dejarlas caer todas a `otro` mataría el `vistaEn` y
el orden para la mitad del backlog.

Se añaden **tres**, y sólo tres:

| área | de dónde sale |
|---|---|
| `fallo-de-arranque` | el embudo (a) |
| `fallo-de-ipc` | el embudo (b) |
| `fallo-de-persistencia` | los tres `throw` que viven en `persistence/` |

**No se añade `fallo-de-render`.** Mientras el enganche del `ErrorBoundary` esté
desconectado no hay emisor, y un área sin emisor es exactamente lo que ADR-081
llama inventar el vocabulario. Nace el día que el enganche se firme.

Las tres son **provisionales y se cierran con el corpus**. Aquí hay una vuelta
de tuerca respecto a `area` y a `tipo`: aquellos se derivaron de 350 y de 190
textos ya existentes; **el corpus de fallos no existe todavía, y lo genera el
propio embudo**. Por eso se empieza con lo mínimo que el código ya demuestra, y
se refina cuando los fallos reales digan qué clases hacían falta.

### 5. La tubería no cambia

La observación de un fallo viaja por donde viaja la de un agente:
`add` (cerco + dedup) → Auto-mejora → export → Claude → import por id.
**Misma tubería, distinta fuente**: la app que rompe en vez del agente que
choca. Es la promesa que ADR-085 hizo para los tres niveles, y se cumple sin
tocar una línea del canal.

## Consecuencias

**Positivas.** Un fallo deja de ser invisible: hoy los 161 `catch` y los 110
handlers pierden todo lo que atrapan. Los dos embudos libres dan el mecanismo
completo sin tocar un solo innegociable. Y la confidencialidad del Nivel 2 queda
**por construcción**, no por redacción: al no guardar el texto, no hay nada que
redactar bien o mal.

**Negativas.** La cobertura del renderer queda a medias hasta que el enganche se
firme: un componente que rompa sigue sin dejar rastro. El envoltorio de los 110
handlers toca mucha superficie aunque cada toque sea mecánico. Y la clase de
fallo es **menos informativa** que un stack: dice *dónde y de qué tipo*, no
*con qué dato*; el operador que quiera el detalle lo tiene en su log local, que
es justo donde debe estar.

**Neutras.** El vocabulario nace incompleto a propósito. La deuda
`no-existe-fusion-de-observaciones-ya-escritas` sigue abierta y ahora recibirá
también fallos; no cambia de tamaño, sólo de fuentes.

**Riesgo residual.** El que ADR-085 tenía en el cerco —redacción best-effort—
**no aplica aquí**, porque el texto no se guarda. Volvería el día que un embudo
necesitara llevar algo del `message`; ese día el texto pasa por un cerco
reforzado y la nota sigue siendo secundaria frente a la clase.

## Alternativas descartadas

**Capturar también los `err()`.** Son 156 y son la app funcionando. El backlog se
llenaría de «ese proyecto ya está en FORTRESS» —uso normal, no un hueco de
FORTRESS— y el dedup por proyectos distintos, que es la señal del backlog,
quedaría dominado por ruido. El código ya separa señal de ruido; forzar la
captura sería ignorar esa separación.

**Guardar el `message` crudo.** Es lo natural y es lo que filtra: 8 de los 17
mensajes interpolados llevan hoy una ruta o una identidad del cliente, y nada
impide que mañana sean más. Sería repetir con los fallos el error que el Nivel 1
tuvo que barrer: ocho observaciones citando rutas ajenas en un fichero
exportable.

**Guardar el stack.** En el AppImage las rutas del stack son del mount FUSE
(`/tmp/.mount_.../resources/app.asar/...`) sobre un bundle de esbuild: no lleva
al cliente, pero tampoco es legible para nadie. Coste de confidencialidad bajo,
valor cercano a cero.

**Enganchar el `ErrorBoundary` al puente ahora.** Cruzaría dos innegociables sin
necesidad: los embudos (a) y (b) ya dan el mecanismo entero, y el componente
puede estar construido y probado sin estar conectado. Se deja listo; se firma
cuando el operador quiera.

**Inventar el vocabulario de fallos por adelantado.** ADR-081 midió un 33 % de
`otro` cuando los tipos se adivinaron, frente al 4 % cuando se derivaron del
corpus. Tres clases que el código demuestra, y el resto cuando haya dato.

**Un `try/catch` en cada uno de los 110 handlers.** Es la alternativa sin
envoltorio, y es exactamente el patrón que dejó a seis agentes sin asentar su
corrida: una garantía que depende de que 110 llamadores se acuerden no es una
garantía.

## Código

`src/main/index.ts` · `src/infrastructure/ipc/register-handlers.ts` ·
`src/domain/shared/result.ts` · `src/domain/system/area-de-observacion.ts` ·
`src/domain/system/self-observation.ts` ·
`src/infrastructure/persistence/asentar-observacion.ts` ·
`src/infrastructure/claude-code/lectura-del-denial.ts` (el molde de las dos
lecturas) · `src/preload/index.ts` y `src/infrastructure/electron/**`
(innegociables: el enganche del renderer los cruza)

## Referencias

- [ADR-085](adr-085-todo-agente-observa-y-nada-filtra.md) — la ley, el cerco y la
  tubería. Este ADR es su **Nivel 2**: mismo canal, fuente nueva.
- [ADR-081](adr-081-el-vocabulario-de-tipos-cubre-codigo-ajeno.md) — derivar el
  vocabulario del corpus y no de una idea previa; por qué sólo tres áreas.
- [ADR-065](adr-065-nada-muere-sin-juicio.md) — ante la duda se conserva; por qué
  el `message` va al log del operador en vez de desaparecer.
- [ADR-084](adr-084-identidad-por-linea-el-simbolo-sale.md) — el campo de texto
  libre es el que baila: aquí el `message` es ese campo, y por eso no viaja.
