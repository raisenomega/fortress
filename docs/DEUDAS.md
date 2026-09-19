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
cerrados a Historia). **El orden de arreglo es 1 → 5 y es innegociable**: el 1 es
un agujero de garantía, el 2 es la raíz de varios síntomas, y los demás dependen
de entenderlos.

### (1) La aprobación de OMEGA no caduca — agujero de garantía

`olvidarAprobacion` (`src/infrastructure/aprobacion-del-plan.ts:32`) tiene **cero
llamadores de producción**. Su propio docblock promete *«El lote termino, o la
seleccion cambio: lo aprobado deja de estarlo»*, y nadie la llama.

**Consecuencia:** los ids aprobados siguen aprobados mientras viva el proceso. Un
segundo lote con los mismos hallazgos **cruzaría la puerta del ADR-097 §4 sin que
OMEGA juzgue nada**. Va primero porque es lo único de la lista que debilita una
garantía escrita.

### (2) El agente cree estar en supervisado — raíz de tres síntomas

El turno de plan del lote manda `mode: 'supervisado'` a propósito, para que no
edite. Pero ese modo viaja hasta el prompt:

`lote-por-enter.ts` → `modo-del-turno.ts:28` → `send-message.ts:47,60` →
`reply-from-chat.ts:45` → **`chat-prompt.ts:33`** → `MODE_INSTRUCTION[mode]`

El agente recibe *«MODO SUPERVISADO: propon los cambios y espera aprobacion»* y
obedece. Evidencia en la base, fila `chat_messages` de `2026-09-19T08:59:56Z`
(`mode='supervisado'`), texto literal del agente:

- *«…para aprobación directa (que es lo que pide el modo supervisado)»*
- *«Bloqueado por el modo supervisado (2):»*
- *«## Necesito cuatro decisiones tuyas»*

**Y un tercer síntoma, el más caro:** el mismo modo da
`permissionModeFor('supervisado') = 'plan'` (`permission-mode.ts:26`), y
`permission-mode.ts:4-8` ya documenta que **`plan` bloquea todas las llamadas
MCP**. El agente lo dijo: *«Grafo bloqueado en plan mode — sigo a mano»*. El turno
más caro del lote —**563 s, $5,02**— planeó sin grafo. El repo ya tiene la
solución (`'lectura'`, usada en `run-investigate.ts:21`); este camino no la usa.

### (3) La barra verde fija en autónomo — UI

`pie-del-lote.ts:36` devuelve `'ejecutando'` **antes** de mirar el modo, así que
la píldora verde `Plan ejecutandose…` (`BotonDelPlan.tsx:8-11`, `bg-success`) sale
también en autónomo y dura todo el lote, porque cuelga de `enCurso` y no de la
fase. Las fases (Debate naranja / OMEGA azul) viven en otro componente,
`RunMeter.tsx`, y por eso aparecen en otro sitio de la pantalla.

### (4) El grafo no se re-indexa tras editar

`GraphChip.tsx:21-23` marca desalineado cuando `indexedSha !== currentSha`. El
lote edita y comitea, así que el sha se mueve y el grafo queda **genuinamente**
desactualizado. Navegar no lo invalida: al volver, el chip relee la verdad.

La causa es que **`api().graph.reindex()` tiene un solo llamador en todo el
repo** — `GraphChip.tsx:54`, el clic del operador. Nada lo dispara tras un turno
del Terminal (`tras-el-turno.ts` y `finish-turn.ts` no mencionan el grafo).

### (5) Un proceso cayó sin dejar rastro, y un hallazgo corrió sin debate

**(a)** La corrida que el operador vio caer **no dejó ninguna fila**: ni en
`agent_runs`, ni en `chat_messages`, ni en `activity`, después de
`2026-09-19T09:42:49Z`. Presupuesto descartado como causa ($28,02 gastados de un
tope de $500/día). **`failed = 0` en las 17 filas del día**: ninguna corrida se
marcó nunca como fallida.

**(b)** En el lote que sí funcionó, el hallazgo 2 —el único que no se cerró—
**no tuvo crítico ni OMEGA**; los hallazgos 1 y 3 sí. Sin explicación medida
todavía.

---

## 2. El contador del escaneo miente

`scans.finding_count = 27` para el escaneo `e7212154` (2026-09-18), contra **23
filas reales** en `findings` con ese `scan_id`. Desfase de 4, a favor del
contador. Lo destapó la auditoría de este documento.

Importa más de lo que parece: ese contador es lo que se lee para decir cuánto
encontró un escaneo, y es la cifra que acaba en un parte o en un informe.

---

## 3. Deudas estructurales

| deuda | evidencia | qué la desbloquea |
|---|---|---|
| **ADR-092 (el sandbox) sin escribir** | `adr-093:546-548,561` lo nombra como bloqueador | es el siguiente ADR; bloquea Bash libre (ADR-093 pieza 3) |
| **Verificación de stacks no-Node** | el gate corre `npm`; un repo Python o Go no se verifica | ADR-092 + Bash libre. **No** un gate por lenguaje: sería mantener N gates |
| **`sendMessage` saturado** | 11 parámetros posicionales (`send-message.ts:23-36`) | rozada tres veces sin tocarla; se parte por costura cuando un arco la despierte de verdad |
| **`build-prompt.ts:6`** | `'- NUNCA toques auth, pagos, RLS ni seguridad sin dejarlo escrito antes.'` | **medir primero**: dice «sin dejarlo escrito antes», no «vuelve a supervisado». Puede ser transparencia legítima o el freno de ADR-089 con otra ropa |

---

## 4. Dónde viven las deudas de FORTRESS sobre su propio código

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
