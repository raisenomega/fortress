# ADR-087: Confirmar un hallazgo exige juicio, y lo confirmado aterriza en su historia

- **Fecha:** 2026-09-12
- **Estado:** Aceptada
- **Área:** Ciclo de vida del hallazgo · Motor de reparación · Tablero

## Contexto

### Dos ejes ortogonales, y ninguno de los dos falta

```
status    = 'open' | 'false_positive'              decisión del OPERADOR
lifecycle = 'ACTIVE' | 'MITIGATED' | 'EXTINCT'     qué le pasa al PROBLEMA
```

Separados a propósito, y el código dice por qué: *«un hallazgo puede estar
descartado y ACTIVE, o abierto y EXTINCT. Mezclarlos haría que descartar
pareciera arreglar»*.

**El destino final ya existe y ya se usa.** Medido el 2026-09-12 sobre la base
del operador:

| lifecycle · status | filas |
|---|---|
| ACTIVE · open | 478 |
| **EXTINCT** · open | **55** |
| MITIGATED · open | 27 |
| ACTIVE · false_positive | 3 |
| MITIGATED · false_positive | 1 |

**Y el filtro que lo saca de la vista también existe:**

```sql
const VIVOS = "project_id = ? AND lifecycle != 'EXTINCT'"
```

con su razón escrita: *«un EXTINCT ya no pide acción: un agente lo miró y
dictaminó que el problema ya no está, y queda como historia. Sin este filtro la
lista crece para siempre desde que la base dejó de borrar»*.

**No falta el estado. No falta el filtro. Falta la TRANSICIÓN.**

### El limbo: 27 hallazgos sin salida

Hoy el operador puede **mitigar** —*«ya está arreglado»*, con su nota y su
fecha— pero **no puede confirmar**. `markExtinct` no tiene handler suyo: sus
únicos llamadores en producción son el analista C2 (`extinguirSiObsoleto`) y el
backfill de identidades de ADR-084.

Los 28 mitigados de hoy son **todos declaración del operador** —ninguno lleva el
prefijo `«obsoleto segun el agente»`— y **todos están en el repo propio**. Del
limbo solo se sale pasando por el motor de reparación entero.

### Lo que EXTINCT dice hoy, y lo que no

De las 55 extinciones:

| motivo | filas | qué afirma |
|---|---|---|
| `(sin motivo)` | **27** | nada: son de agosto, de antes de que la columna existiera |
| `fusionada-con-*` | 20 | absorbida por otra fila (ADR-084), no resuelta |
| `juicio_obsoleto` | **8** | un agente leyó el fichero y encontró el marcador |

**Solo 8 de 55 afirman que alguien miró.** Las 27 sin motivo son de la era en
que la AUSENCIA extinguía, que es la regla que ADR-065 vino a matar: la que
cerró dos hallazgos de la CSP *«porque alguien añadió un COMENTARIO al
archivo»*, con el `unsafe-inline` que denunciaban todavía en `main`. El propio
`finding-lifecycle-sql` lo dice: sin el motivo no hay *«cómo distinguir una
muerte con juicio de una por descuido — que es exactamente lo que hubo que
reconstruir a mano»*.

### Dos hallazgos del inventario que cambian el tamaño del arco

**La maquinaria ya está construida entera.** `plan-repair` NO propone ningún
fix: estudia con el analista C2, dictamina, y llama a `extinguirSiObsoleto`, que
extingue **solo si encuentra el marcador en el fichero de hoy** y si no lo
encuentra deja `MITIGATED` con la razón escrita. El camino dirigido existe y
tiene IPC (`elegirObjetivo(..., findingId?)`). Y la transición de base ya admite
el origen que hace falta:

```sql
MARK_EXTINCT ... WHERE id = @id AND lifecycle IN ('ACTIVE', 'MITIGATED')
```

*«Mitigado es "hay un fix, falta confirmar", así que extinguirlo ES esa
confirmación: sin este segundo estado de origen, un hallazgo marcado por el
operador no podría cerrarse jamás.»*

**Lo que lo bloquea es UNA línea:**

```ts
export const vivo = (f: FindingMemory): boolean =>
  f.lifecycle === 'ACTIVE' && f.status === 'open'
```

Un `MITIGATED` no es `vivo`, así que `elegirObjetivo` devuelve `null` y el
camino dirigido **rechaza en silencio justo a los 27 que hay que verificar**.

## Decisión

### 1. Dos intenciones, dos puertas

`vivo` **no se toca**. Es correcta donde está: un mitigado no debe entrar en la
cola de reparación, porque el operador ya dijo que hay un fix y repararlo otra
vez sería inventar trabajo.

Lo que se añade es una puerta paralela con su propia intención:

| intención | qué acepta |
|---|---|
| objetivo de **REPARACIÓN** | `ACTIVE` + `open` — intacto |
| objetivo de **VERIFICACIÓN** | `MITIGATED` — el limbo, y solo él |

Es la misma forma que ya separa `status` de `lifecycle`: **reparar y verificar
son actos distintos, y mezclarlos haría que verificar pareciera pedir un fix.**

### 2. El gesto: el operador PIDE, el agente OTORGA

Un botón «confirmar» en cada fila `MITIGATED` lanza al analista C2 **solo sobre
esa fila**. El agente lee el fichero:

- **encuentra el marcador** → `EXTINCT` con `juicio_obsoleto`, y la fila
  aterriza en la historia.
- **no lo encuentra** → sigue `MITIGATED`, con la razón escrita: *el operador
  dijo arreglado y el marcador no está, revísalo*.

Ese segundo caso es el que justifica todo lo demás: **el sistema protege al
operador de su propio error.** Un fix que no cerró el problema no se cierra en
silencio.

### 3. La verificación deja rastro de verificación, no de propuesta

No se reusa el camino de propuestas tal cual. Hoy `plan-repair` inserta una
`Proposal` en `ELEGIDO` y la mueve a `ANALIZADO` con sus eventos; hacerlo aquí
llenaría la lista de propuestas de propuestas que **nunca quisieron reparar
nada** — ruido que miente sobre la intención, igual que un mitigado en la cola.

Cada acto con su rastro honesto: el libro tiene que poder decir *«el operador
pidió verificar X, el agente dictaminó Y»*. Si eso es un tipo de evento nuevo o
se reusa algo sin ensuciar propuestas lo dirá el inventario de la Fase 1.

### 4. La verificación respeta el carril, y la pantalla lo dice

El carril del motor (`if (busy !== null) return err(busy)`) existe para que dos
agentes no pisen el mismo proyecto, y verificar es un agente más. **Se respeta.**

Consecuencia que no se maquilla: verificar es **secuencial, de una en una**. Los
27 del limbo son 27 turnos, cada uno un spawn. La pantalla lo enseña —progreso
visible, botón deshabilitado mientras el carril está tomado— en vez de fingir
que es instantáneo. Un gesto de «verificar todos» que los encole con progreso es
refinamiento; el botón por fila es el núcleo.

### 5. Quién cerró, no solo cómo

`extinct_reason` dice **cómo** murió un hallazgo (`juicio_obsoleto`), no
**quién** lo cerró. Mientras solo extinguía el agente, deducirlo del motivo
bastaba. Con la verificación a petición del operador deja de bastar: hay que
distinguir *el agente lo comprobó* de *el operador lo pidió*. Es la única pieza
que le falta al hallazgo frente al molde de cierre de las observaciones
(`status` · `reason` · `attended_by` · `attended_at`), que ya tiene las otras
tres en `mitigated_note` / `extinct_reason` / `mitigated_at` / `resolved_at`.

### 6. El destino: la página de HISTORIA

*Diseño del operador:* una página completa en el sidebar, ordenada por fecha de
hallazgo y fecha de confirmación, con paginación y chip por severidad.

Sobre la query que **ya existe**: `SELECT_MEMORY` devuelve el expediente
completo, extintos incluidos. No necesita query nueva; necesita pantalla.

**Los extintos no desaparecen: aterrizan ahí y permanecen.** Nada muere sin
juicio, y lo juzgado queda como historia consultable.

**Y la historia tiene que decir la verdad sobre sus muertos.** 27 de las 55
extinciones no llevan juicio ninguno —son de la regla vieja— y 20 son fusiones,
que no son resoluciones. Pintarlas todas como «resuelto» repetiría en una
pantalla nueva exactamente la mentira que ADR-065 vino a impedir. La página
distingue las tres clases o no se publica.

## Consecuencias

**Positivas.** Los 27 del limbo tienen salida, y por la puerta correcta: el que
confirma es quien mira el código. `EXTINCT` sigue significando *«un agente
verificó que el problema ya no está»*, que es lo único defendible ante un
auditor. Y el arco es pequeño: una puerta, un botón, una columna y una pantalla
sobre una query existente.

**Negativas.** Verificar cuesta un spawn y toma el carril, así que vaciar el
limbo lleva 27 turnos. La guarda `vivo` deja de ser el único criterio de
«objetivo válido» y ahora hay dos, que es una cosa más que entender al leer el
motor.

**Neutras.** El arco va **antes** de la UI a propósito: el rediseño del tablero
necesita saber que hay dos mundos —lo que pide acción y lo que es historia— y
hoy el modelo no lleva nada del primero al segundo sin pasar por el motor
entero. El modelo antes que la vista.

**Deuda que el inventario destapó y que este ADR no cierra.** `TOUCH_FINDING`
resucita un hallazgo que un escaneo vuelve a ver —`lifecycle = 'ACTIVE'`,
`resolved_at = NULL`— y eso es **correcto**: si un agente dijo «obsoleto» y el
escáner lo sigue viendo, vuelve, y esa es la red funcionando. Pero **no limpia
`extinct_reason`**, así que la fila queda ACTIVE afirmando que la extinguió un
juicio. Hay dos filas así hoy, y son la razón de que un primer recuento diera
10 `juicio_obsoleto` donde solo 8 siguen extintas. La columna miente sobre el
estado actual y cualquier informe que la lea sin mirar el `lifecycle` cuenta
mal.

## Alternativas descartadas

**Extinción declarada por el operador** (`extinct_reason = 'declarado_por_operador'`).
Inmediata, vaciaría el limbo hoy, y es exactamente lo que ADR-065 prohíbe. Es el
incidente de la CSP otra vez, ahora con un botón: el operador dice «arreglado»,
la fila desaparece, y si se equivocó —o el fix estaba en otro sitio, o lo
revirtió— el problema queda vivo e invisible. Un falso positivo molesta; un
falso negativo miente. Y diluiría `EXTINCT` de *«un agente lo comprobó»* a
*«alguien dijo que sí»*, que es la diferencia entre una afirmación auditable y
un post-it.

**Aflojar la guarda `vivo`** para que acepte `MITIGATED`. Metería los mitigados
en la cola automática de reparación, y el motor repararía lo que el operador ya
dio por arreglado. La guarda no está de más; está en el sitio equivocado para
otra intención.

**Reusar `Proposal` para verificar.** Barato y mentiroso: una propuesta que
nunca quiso reparar ensucia la vista de propuestas y borra la diferencia entre
querer arreglar algo y querer comprobarlo.

**Borrar los extintos.** Viola ADR-065 por el otro lado. Lo juzgado es historia,
y la historia se consulta.

**Esperar al rediseño de la UI.** Es lo que parecía natural y es el orden
inverso: sin la transición no hay dos mundos que pintar, y el tablero se
rediseñaría sobre un modelo que no sabe cerrar nada.

## Fases

| fase | qué | por qué en ese orden |
|---|---|---|
| **1** | **LA RE-VERIFICACIÓN DIRIGIDA** — la puerta de verificación, el botón, el rastro y el quién | Es la transición que falta; sin ella la historia está vacía |
| **2** | **LA PÁGINA DE HISTORIA** — la pantalla sobre `SELECT_MEMORY`, con las tres clases distinguidas | Necesita que haya algo que aterrice, y saber qué muertos son cuáles |

La Fase 1 abre con su propio inventario: el rastro de verificación (evento
propio o reuso sin ensuciar propuestas) y el detalle del carril y el progreso.

## Código

`src/application/repair/elegir-objetivo.ts` (la guarda `vivo`) ·
`src/application/repair/extinguir-con-juicio.ts` ·
`src/application/repair/plan-repair.ts` ·
`src/infrastructure/persistence/finding-lifecycle-sql.ts` ·
`src/infrastructure/persistence/finding-sql.ts` (`VIVOS`, `SELECT_MEMORY`, `TOUCH_FINDING`) ·
`src/infrastructure/ipc/finding-decision-handlers.ts` ·
`src/domain/project/finding-lifecycle.ts` · `src/domain/scan/ausencia.ts`

## Referencias

- [ADR-065](adr-065-nada-muere-sin-juicio.md) — la ley que este ADR aplica a la
  última transición que le faltaba: ni la ausencia ni la palabra cierran nada.
- [ADR-084](adr-084-identidad-por-linea-el-simbolo-sale.md) — las 20 extinciones
  por fusión, que no son resoluciones y la historia no debe pintar como tales.
- [ADR-085](adr-085-todo-agente-observa-y-nada-filtra.md) — el molde de cierre
  (`status` · `reason` · `attended_by` · `attended_at`) del que sale el «quién».

## Enmienda (2026-10-12): la prueba puede vivir en el fichero del arreglo

### El flanco que destapó el re-demo de un cliente

Un hallazgo de policy (`facade-images`, subida anónima sin scoping) estaba
anclado a la migración donde se **detectó**. El arreglo correcto para un
esquema **append-only** no edita esa línea —no se puede, la migración ya
corrió—: añade **otra** migración que hace `DROP POLICY`. La prueba de
extinción, sin embargo, solo miraba el fichero del ancla: la policy mala
seguía textualmente ahí (append-only), y el `DROP` vivía en el fichero nuevo.
Resultado: `estaProbado` nunca cuadraba, el hallazgo quedaba **MITIGADO** aunque
el cierre en el repo fuera completo. No es fallo del juicio ni exige runtime —el
gate es un `includes` de string puro—: es que la prueba estaba **confinada al
ancla**, mientras que el ARREGLO (y la libertad de `where`) ya podían vivir en
otro fichero desde [ADR-102](adr-102-el-arreglo-fuera-de-la-correa.md). La
asimetría era el defecto.

### La decisión

La `Evidencia` de un OBSOLETO puede nombrar un `file` opcional donde vive el
marcador. Ausente = el fichero del ancla (`target.file`) = comportamiento
anterior, byte a byte. Extiende a la PRUEBA DE EXTINCIÓN la lección de ADR-102
(el arreglo vive donde el juicio diga, no en el ancla).

### La mitigación (no negociable) y el trade

El `file` citado SOLO se honra si **el arreglo de ese turno lo tocó**, verificado
por git (`fileHistory.tocadoPorElArreglo`: aparece en el diff desde el sha del
turno, committeado o no). Un `presente` trivial en un fichero **ajeno** —que el
fix no tocó— no cierra nada. El trade es honesto: ensancha el límite ya anotado
aquí (un marcador lo elige el agente), pero NO en su naturaleza —sigue siendo una
cadena literal comprobada contra un fichero, ahora acotada además por «lo tocó el
arreglo»—. El cierre pleno de ese límite (exigir que el marcador naciera con el
fix) sigue siendo su propia pieza futura. Ante cualquier duda de git: `false`,
se conserva (ADR-065).

### Alcance

`estaProbado` **no cambia**: sigue recibiendo el contenido ya elegido y no mira
`file`. Quien elige el fichero y aplica la mitigación es `extinguirSiObsoleto`.
El contrato `Evidencia` (`+ file?`) es la única pieza firmada que toca; el resto
(puerto git, cableado, prompt del analista) es libre.
