# ADR-117 — El aterrizaje del lazo (A-1→A-5)

- **Fecha:** 2026-10-13 (documenta lo construido y firmado: A-1 `f281b28`, A-2
  `e87246d`, A-3 `bd07e63`, A-4 `fbd381e`, A-5 `504341a`; medido sobre `main@86cc0ba`)
- **Estado:** Aceptada. En main y firmado incremento a incremento por el operador.
- **Área:** Lazo autónomo · Terminal
- **Relación:** complemento de [ADR-116](adr-116-lazo-autonomo-cto-terminal-sello-2b.md)
  (el lazo proponía y reparaba; este ADR es cómo LANDA). Se apoya en la red de
  reversión ([ADR-079](adr-079-editar-el-arbol-vivo-exige-red-de-reversion.md)) y el
  cierre de ciclo ([ADR-088](adr-088-terminal-grado-bancario.md)); reusa el selector
  de severidad firmado (`selectTarget`).

## 1. Contexto: el lazo orquestaba, pero NO aterrizaba

El primer demo real (mailbd) mostró el lazo de ADR-116 moviéndose bien —el CTO
elegía, saltaba, el Terminal trabajaba hondo— pero **nada quedaba**. El reflog del
proyecto cliente contaba la historia: **7 ciclos de «checkpoint transitorio» →
`reset HEAD^`**, ningún commit durable, nada pusheado, el CRITICAL intacto. El
trabajo se hacía y se deshacía cada vuelta.

El diagnóstico fue **«tres causas = una»**:

1. **PASOs sin foco.** El lazo enviaba el encargo sin `findingId`. En
   `turno-del-terminal.ts:43`, `if (!activa || foco === null)` toma la rama SIN
   juez: OMEGA (`juezConOmega`) y el cierre de ciclo del hallazgo (ADR-088) solo
   corren con `foco !== null`. Sin foco, el turno reparaba pero nadie lo juzgaba
   ni cerraba el hallazgo.
2. **Sin commit durable.** La red de reversión (ADR-079) `conservar()` =
   `reset --soft <sha>^`: deja el trabajo en el ÁRBOL, pero no lo COMMITEA. Sin un
   commit durable por turno, el siguiente checkpoint/reset lo churnea y HEAD nunca
   avanza.
3. **El grafo ciego.** Sin HEAD que avance, el índice del grafo se queda en un sha
   fantasma (la vieja creencia de «re-indexar tras editar» no lo arregla).

Las tres colapsan en una: **sin foco y sin commit durable, el lazo trabaja en el
vacío.** El aterrizaje es darle las dos cosas.

## 2. Decisión: cinco incrementos

- **A-1 — La cola (`f281b28`).** Una cola determinista de hallazgos, congelada
  (snapshot) al arrancar el lazo. REUSA la selección firmada: `ordenarCola` llama a
  `selectTarget` (severity-first) en bucle sobre `candidates()`; IPC `repair:cola`.
  No inventa criterio nuevo —saca la misma cabeza que el Motor—.
- **A-2 — El foco en el salto (`e87246d`).** El auto-salto enfoca la cabeza de la
  cola: `setFoco({projectId, findingId})` ANTES de enviar. **`findingId` es la
  llave maestra**: enciende OMEGA + el verify/cierre (ADR-088) + los agentes
  completos del turno. Es la cura de la causa 1.
- **A-3 — Dirigir el CTO a la cabeza (`bd07e63`).** El PASO del CTO nombra el
  hallazgo de la cabeza (id + `fichero:línea`), para que el encargo y el foco
  coincidan y el commit salga bien etiquetado.
- **A-4 — El commit durable (`fbd381e`).** Al cerrar la vuelta, un commit atómico
  por turno: `fix(<findingId>): <título>`. Guard de repo propio
  (`isFortressRepo` → no toca FORTRESS); `add -A` sobre un árbol limpio (la WIP del
  operador va a un **stash** con marca `fortress-lazo-wip` al arrancar, y vuelve al
  parar); `commit --no-verify`. **LOCAL: jamás pushea.** Es la cura de la causa 2 (y
  de la 3: HEAD avanza, el grafo se realinea).
- **A-5 — El cierre (`504341a`).** La cola avanza (`popCola`) **solo si el hallazgo
  se extinguió de verdad** (`seExtinguio`: `lifecycle === 'EXTINCT'`, nunca por
  ausencia, ADR-065; IPC `repair:lazo-extinto`). Refresca las cuentas para que el
  candado del push se abra solo si caen los CRITICAL —el lazo no lo abre—.

## 3. Alternativas consideradas

- **(a) Re-indexar el grafo tras editar, sin commit durable.** Descartada: era la
  creencia falsa que dejaba el índice en un sha fantasma; no persiste el trabajo,
  solo describe un árbol que el siguiente turno deshace.
- **(b) Que el lazo PUSHEE para persistir.** Descartada: el push es la frontera
  humana (ADR-116). Aterrizar es LOCAL; cruzar es firma.
- **(c) `conservar()` solo (reset --soft) como «aterrizaje».** Descartada: mantiene
  el trabajo en el árbol pero no lo commitea; el siguiente checkpoint lo revuelve.
  Fue justo el estado del demo que falló.
- **(d) Una cola nueva, propia del lazo.** Descartada: reusar `selectTarget`
  (firmado, severity-first) garantiza que el lazo ataca en el MISMO orden que el
  Motor, sin una segunda lógica de severidad que pudiera divergir.
- **(e) Un foco que no fuera `findingId`.** Descartada: `findingId` es exactamente
  lo que `turno-del-terminal.ts:43` mira para encender el juez y el cierre; es la
  llave mínima que enciende todo.

## 4. Consecuencias

- **El lazo ahora persiste:** cada vuelta deja un commit durable local y la cola
  avanza solo ante una extinción probada.
- **`findingId` = foco es la llave** que enciende OMEGA, el verify/cierre y los
  agentes completos; sin ella el turno repara en el vacío.
- **Respeta la frontera de ADR-116:** aterriza LOCAL, nunca cruza a push; el candado
  lo abre que caigan los CRITICAL, y pushear es el botón del operador.
- **Enlace con P1 (ADR-118):** el commit durable POR TURNO (A-4) es justo lo que
  después OBLIGÓ la **ventana-por-foco**. Al committear cada turno, el fix de un
  turno anterior quedaba por debajo de la base del turno de verify → invisible a la
  puerta touched-by-fix → un append-only no cerraba. P1 lo arregló midiendo desde
  el inicio del trabajo enfocado (`baseDelFoco`), no desde el turno. A-4 habilitó el
  aterrizaje y, de paso, creó el problema que P1 resolvió.
