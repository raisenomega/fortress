# ADR-078: Modelo por agente, declarado en el catálogo y transportado por `--agents`

- **Fecha:** 2026-09-06
- **Estado:** Aceptada
- **Área:** Agentes · Coste

## Contexto

Los once agentes de auditoría corrían todos con **el modelo de la sesión**: el
que tuviera configurado el CLI en ese momento. Ninguno lo elegía, y el catálogo
—que ya decide el nombre, el propósito, el icono y hasta la carta de OMEGA— no
tenía dónde ponerlo.

Eso mezcla trabajos que no se parecen. El Security Reviewer decide si algo es un
defecto y con qué gravedad, y una severidad mal puesta arrastra al motor entero;
el Refactor Cleaner busca imports sin usar contra un criterio ya escrito. Correr
los dos con el mismo modelo significa o pagar razonamiento caro para barrer, o
juzgar con un modelo que no da para juzgar.

## Decisión

`Agent` gana **`model?: string`**, hermano de `charter`: mismo sitio, misma
semántica de opcional, misma forma de resolverse. `AgentDefinition` gana el mismo
campo, y `buildAgentsPayload` lo copia **solo si el agente lo declara**.

### Por qué dentro de `--agents` y no `--model` global

Los once agentes **ya viajan** como JSON en `--agents`, uno por uno, con su
descripción y su prompt. El campo entra ahí, en el objeto de cada uno.

La alternativa era añadir `--model` a `buildArgs`, y es peor por dos razones
independientes:

- **Da un modelo por SPAWN, no por agente**, que es menos de lo que hace falta:
  un escaneo lanza varios agentes en el mismo proceso.
- **`claude-cli.ts` está en la lista innegociable** (`auto-merge-blacklist.ts:22`,
  *«arma el entorno de TODO agente, con sus tools y su MCP»*). Tocarlo exige firma
  humana. La ruta por `--agents` no lo roza: ese fichero recibe el `Record` ya
  construido y solo hace `JSON.stringify`.

### El reparto, y el criterio

El criterio es **qué hace el agente**, no su importancia:

| modelo | agentes | por qué |
|---|---|---|
| `opus` | security-reviewer, sentinel-omega, planner, cognition | **Juzgan.** Deciden si algo es un defecto y con qué gravedad, o qué se toca antes de tocarlo. Equivocarse sale caro y el error no se ve hasta mucho después. |
| `sonnet` | code-reviewer, tdd-guide, build-error-resolver, e2e-runner | **Ejecutan contra algo comprobable.** Un test que pasa o no, un build que arranca o no. El trabajo se verifica solo. |
| `haiku` | refactor-cleaner, code-simplifier, opensource-sanitizer | **Barren.** Pasadas mecánicas sobre criterios ya escritos. |

Cuatro, cuatro y tres.

### Alias y no un id fijo

Se declara `opus`, no `claude-opus-5`. Los alias siguen al último de su familia,
así que un agente sube de versión solo cuando sale la siguiente. Un id clavado
obligaría a editar el catálogo en cada release, y **un catálogo que hay que tocar
para seguir al día acaba desactualizado** — que es exactamente el fallo que esta
casa lleva persiguiendo en las listas que se escriben a mano.

### Por qué ninguno en Fable

> **Corregido el 2026-09-15 ([ADR-088](adr-088-terminal-grado-bancario.md),
> Enmienda 3): la retención es del modelo, no del fallback.** Fable es un
> «Covered Model»: exige 30 días de retención por sí mismo, en toda petición, y
> no está disponible bajo retención cero salvo autorización expresa de Anthropic.
> Tampoco el fallback a Opus 4.8 ante ciberseguridad ofensiva es propio de Fable:
> Opus 5 hace lo mismo. La conclusión se mantiene —ningún agente en Fable—;
> cambia su porqué. El texto de abajo se conserva tal como se escribió; la
> resolución y sus fuentes, con fecha, están en la Enmienda 3 de ADR-088.

Su fallback ante una petición de ciberseguridad cae a Opus 4.8 **con retención de
30 días**. Este repositorio audita código ajeno bajo doctrina de cero telemetría,
y un agente que a veces retiene y a veces no es peor que uno que nunca lo hace:
la garantía deja de poder afirmarse. Se descarta por doctrina, no por capacidad.

### La ausencia significa algo

Sin `model`, el agente **hereda el de la sesión**. Es lo que hacían los once
hasta ahora y lo que siguen haciendo los agentes auto-propuestos
(`active-custom-agents`), que no se tocan: el campo es opcional y su ausencia es
una respuesta, no un olvido.

La llave se **omite** cuando no hay modelo, en vez de viajar en `undefined`. Y la
cadena vacía se omite también: es un descuido, no una elección, y mandaría al CLI
a pedir un modelo sin nombre. Lo destapó una prueba antes de salir de la rama.

## Verificado contra el CLI, no supuesto

El `--help` de la 2.1.263 documenta `--agents` con un ejemplo de solo
`description` y `prompt`: no menciona `model`. Así que se comprobó **corriendo el
CLI**, con tres agentes de prueba y leyendo el `model` del `system/init` y el
`modelUsage` del `result` en el stream-json — el id del modelo directo, nunca
inferido por coste ni por tiempo.

| agente de prueba | `model` declarado | modelo que corrió |
|---|---|---|
| `probador-haiku` | `haiku` | `claude-haiku-4-5-20251001` |
| `probador-opus` | `opus` | `claude-opus-5` |
| `probador-mudo` | *(sin campo)* | `claude-opus-5[1m]` |

El tercero es el que cierra la prueba. Sin él, la corrida de `opus` no
demostraría nada —coincide con el modelo de la sesión— y la de `haiku` podría
atribuirse a cualquier otra cosa. Con el control se ven **tres valores
distintos**: el alias `haiku` desvía, el alias `opus` resuelve a
`claude-opus-5` (sin el sufijo `[1m]` que lleva el de la sesión, así que tampoco
es herencia), y la ausencia hereda. El campo se respeta.

La ventana de contexto no se resiente: las dos variantes de opus reportan
`contextWindow: 1000000`. Se comprobó porque el sufijo distinto lo hacía dudoso,
y la duda resultó infundada.

## Consecuencias

- El coste de un escaneo deja de ser uniforme: baja donde se barre y se mantiene
  donde se juzga. No se ha medido todavía cuánto.
- **Los once declaran modelo**, y una prueba lo fija con el reparto escrito
  aparte: cambiar con qué modelo juzga el Security Reviewer deja de poder
  colarse como «un ajuste».
- Si el CLI dejara de aceptar `model` por definición, el campo se ignoraría en
  silencio y todos volverían al de la sesión — degradación sin caída, pero
  silenciosa. La forma se verificó contra la versión 2.1.263.
- `claude-cli.ts` no se tocó. La lista innegociable sigue intacta.

## Código

`src/domain/agent/agent.ts` · `src/domain/agent/agent-prompt.ts` ·
`src/domain/agent/default-agents.ts` · `src/domain/agent/optional-agents.ts` ·
`src/domain/agent/sentinel-omega.ts` ·
`src/domain/agent/reparto-de-modelos.test.ts` ·
`src/domain/agent/modelo-en-el-payload.test.ts`


## Enmienda (2026-10-05): nadie hereda — el reparto llega al Motor, a las rutas sin agente y al SDK

Decisiones del operador, el 2026-10-05. Construidas en la rama
`feat/modelo-declarado-y-429`; las piezas que tocan defensas, con su firma.

### Lo medido que la motiva

La regla «sin `model`, el agente hereda el de la sesión» se escribió para los
once del catálogo y dejó fuera a quien nació después. La noche del 05-oct se
midió con sondas reales:

- Los cuatro procesos del Motor (analista, crítico, OMEGA, generador) se
  lanzaban sin `--agents`, sin `--agent` y sin `--model`: **heredaban**.
- Heredar resultó ser una **lotería**. El CLI resuelve el modelo por defecto a
  partir de la configuración remota de la cuenta y de cachés locales. Lo
  resolvió a **Fable** (prohibido por ADR-088 Enm. 3: 30 días de retención)
  esa noche, y a **Opus** horas después. La propia variable de privacidad de
  FORTRESS cambia el resultado.
- `MODELO_DE_OMEGA`, decidido el 15-sep en ADR-088 Enm. 3 §2, **nunca se había
  construido**. El comentario «nada corre con Fable» de
  `escalera-de-modelos.ts` era falso.

### La decisión

1. **Ningún agente hereda: todos declaran.** Siempre por **alias**
   (`opus` / `sonnet` / `haiku`), nunca un id fijo, para que suban solos.
2. **Una sola fuente para los que no están en el catálogo**:
   `src/domain/agent/modelo-por-rol.ts`, añadida a `AUTONOMY_RULES_FILES` (el
   Motor no puede cambiar su propio modelo). El reparto, con su porqué, está en
   la tabla de [AGENTS.md](../AGENTS.md).
3. **`MODELO_DE_OMEGA = 'opus'`**, al fin construido, sin derivarse de `CIMA`.
4. **El generador va en `opus`.** Es una **excepción deliberada** al criterio
   «ejecuta → sonnet»: es el equivalente del Productor del Terminal (opus por la
   escalera), y lo que produce lo juzga después OMEGA.
5. **`--model` por proceso, como excepción anotada a este ADR.** Este ADR
   prefirió `--agents` porque `--model` da un modelo por spawn y no por agente.
   En el Motor **cada proceso ES un agente**, así que ahí un `--model` por
   proceso es exactamente un modelo por agente (`generator-args.ts`, defensa,
   con firma). Los turnos sin agente siguen la vía de este ADR sin tocar
   `claude-cli.ts`: la petición lleva `model`, `argsDelTurno` lo pone, y **un
   turno sin agente y sin modelo no se lanza**.
6. **El SDK resuelve el alias contra el catálogo de la API**
   (`modeloDeLaApi`): elige el más nuevo de la familia y **nunca** Fable. El id
   fijo `claude-opus-5` desaparece.
7. **El guardián del modelo real** (`guardia-del-modelo.ts`). Cada corrida guarda
   en `agent_runs.modelo` el modelo que **de verdad** corrió: `modelUsage` del
   CLI, o `model` de la respuesta de la API. Hay tres desenlaces:
   - **Falla** si corrió en Fable, o si el modelo principal está por debajo del
     pedido. En el Motor es la avería `modelo_no_asignado` y para la tanda; en
     un turno, el turno queda fallido y lo dice; en el SDK, el chat no entrega
     la respuesta.
   - **Avisa** si aparece un Opus más viejo de *fallback*: se registra y se
     sigue, nunca para el Motor.
   - En otro caso, **ok**.
8. **La barrera derivada** (`modelo-declarado-barrera.test.ts`), con el molde de
   `spawn-entorno-acotado`, vigila **dos puertas**:
   - todo fichero de `src/` que lanza `claude` debe construir sus args con un
     declarante;
   - todo cliente del SDK debe resolver el alias y no puede contener un id fijo.

   La lista se deriva: un lanzador nuevo sin modelo pone el gate en rojo. En su
   primera pasada **cazó `ab-graph.ts`**, que el censo a mano no vio.

### La frontera, literal

**La barrera cubre `src/` (lo que la app lanza); `scripts/` son herramientas del
operador, se corren a mano, heredan por decisión consciente y quedan fuera de
alcance.**

### Construido junto, de la misma noche: el 429 es avería

El analista, OMEGA y el crítico leían el `result` del CLI sin mirar `is_error`.
El aviso de cuota agotada (429) llegó como si fuera su respuesta: la tanda lo
tomó por «análisis ilegible» y quemó la baraja (16 rechazos en 40 s). Ahora los
tres lo leen como `provider_error`, que es avería y para la tanda al primero, y
la corrida se asienta **fallida**, no como «ok $0 1t».

### Enmienda 2026-10-06: el escáner también asienta el modelo real

El guardián del punto 7 ya inyectaba el modelo que corrió en la respuesta de
todo turno (`guardia-del-turno.ts`), pero el embudo del ESCANEO lo tiraba por
el camino: las 62 corridas `kind='scan'` de la historia quedaron con
`modelo = null` y no se podía auditar en qué modelo escaneó FORTRESS.

Desde hoy el escáner persiste **el que corrió, nunca el pedido del catálogo**
—la noche del 05-oct probó que divergen—, con la misma vara que el Motor
(`record-motor-run.ts`) y que los seis sin orquestador (`agente-que-asienta.ts`):

- **Cada parada** (ok y fallida) copia `reply.modelo` a su salida, y su fila de
  `scan_parada_runs` lo lleva en la columna nueva `modelo` (nullable, migración
  aditiva por `columnas-sueltas.ts`).
- **La corrida agregada** afirma un modelo solo si puede: con paradas uniformes,
  ese; con mezcla, el del **peldaño más bajo visto** —leyendo la escalera, que
  es justo el que esta doctrina quiere cazar—; y si UNA parada no reportó el
  suyo, la fila queda null, porque afirmar un modelo que no consta sería
  inferir (`modelo-del-recorrido.ts`).
- **Sin backfill**: las 62 viejas quedan null. NULL es «anterior a la pieza»;
  clasificarlas por el modelo declarado mentiría, porque declarado ≠ corrido.

**Hermano pendiente, su propio paso:** el embudo del CHAT tiene el MISMO hueco
(`record-chat-run.ts:31-52`, ambas ramas): las 74 filas `kind='chat'` de la
viva están todas a null aunque el turno pasa por el guardián.
