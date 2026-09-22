# ADR-099 — Los hermanos del hallazgo son contexto para el juicio, no una decisión: se citan por SEDE antes que por CLASE, y «otro» no agrupa

- **Estado**: Aceptada (firmada por el operador el 2026-09-22)
- **Fecha**: 2026-09-22
- **Alcance**: la línea de «hermanos» del prompt del analista (motor, paso
  «entender», camino normal y reintento). **No toca** el escáner, el sync, la
  identidad de ADR-084, la UI ni el Historial, ni el esquema de la base.
- **Relación**: se apoya en **ADR-071** (cuándo dos filas son una) y **ADR-084**
  (la identidad lleva la línea) para trazar la frontera con la fusión · usa el
  vocabulario cerrado de **ADR-067/081** · respeta la correa de **ADR-012** (el
  fix sale del ancla propia) · es la sub-pieza 2 del arco #3 del ROADMAP («el
  contrato del hallazgo»), corte 1 de tres.
- **Nace de**: la medición del 2026-09-22 sobre `main@dead78f` y la base viva en
  solo lectura, tras cerrar la sub-pieza 1 (backfill de las 98 zombis). Los
  hermanos entraron en el código el 2026-09-06 (`a947302`) sin ADR y sin
  documentación; el backlog de auto-mejora los venía señalando.

---

## 1. Contexto

### 1.1 Qué son los hermanos hoy, y qué NO son (medido)

`hermanosDelHallazgo` (`src/domain/repair/hermanos-del-hallazgo.ts`) recibe el
hallazgo elegido y los abiertos del proyecto (`status = open`,
`lifecycle = ACTIVE`) y se queda con los del **mismo `tipo`**, sin mirar fichero,
símbolo ni línea. Cita 5, ordenados por urgencia (open, severidad, fichero,
línea), y dice «y N más». Devuelve **prosa**.

- **Su único consumidor** es el prompt del analista, vía `Candidate.hermanos`
  (`estudiar-con-memoria.ts` → `analysis-prompt.ts`). Es contexto para el
  juicio «entender».
- **NO deciden reparación**: el prompt dice «NO los arregles ni los cites como
  where»; la correa del fix se calcula desde el ancla propia (ADR-012).
- **NO se muestran al operador**: cero usos en presentación y en el Historial.
- **NO se persisten**: si el analista concluye «es el mismo defecto en dos
  sedes», lo dice en `notes`, que van al backlog de auto-mejora
  (`self_observations`) y no vuelven a la fila. El juicio se repite en cada
  corrida.
- El «hermanos» del Terminal es otro concepto (los demás hallazgos del lote,
  solo contexto, ADR-088) y no cambia aquí.

### 1.2 Los dos errores del emparejamiento por clase (base viva, 528 vivas)

**Mismo defecto tratado como distintos.** `send-invoice/index.ts` tiene **seis
filas ACTIVE** para un defecto (sin rate limiting): una en la línea 258 y cinco
en la 268 con cinco tipos distintos, salidas de cinco escaneos entre el 4 de
agosto y el 8 de septiembre. El tipo elegido por el escáner derivó entre
escaneos, la identidad `fichero|línea|tipo` cambió, y el sync abrió fila nueva
(ADR-084 §4: no funde, duplica). Hoy la fila de la 258 ve 3 hermanos —uno es su
gemelo real, dos no— y una de las cinco de la 268 ve **cero**: su tipo es único
en el proyecto. Las cinco de la misma línea no se ven entre sí. En toda la base:
25 grupos con la misma línea y más de un tipo (55 filas), 16 pares a 3 líneas o
menos con tipo distinto, y 35 grupos «mismo fichero y mismo símbolo» con más de
una abierta (89 filas, 28 mezclan tipos). El backlog: «UN único hallazgo emitido
tres veces contra tres líneas consecutivas del mismo bloque».

**Defectos distintos tratados como hermanos.** 371 de las 418 vivas con tipo
recibirían al menos un hermano; son 4.268 citas posibles y el **97 % está en
otro fichero**; 275 hallazgos tienen todos sus hermanos en otro fichero. En
mailbd, `public/_headers:7` (CSP con comodines) recibe cuatro hermanos
`allowlist-permisiva`: el producto que llega en el body del checkout, orígenes
localhost en CORS, el atributo style del saneador y las URLs protocol-relative.
Cuatro defectos sin relación. Y **`otro` cuenta como clase**: Raisen Omega tiene
34 abiertas `otro`, así que cada una cita 5 y añade «y 28 más»; el backlog:
«agrupó este hallazgo con 12 hermanos que son todos de accesibilidad».

Lo que cuesta: tokens del analista descartando hermanos ajenos, y la señal
buena (el gemelo real) diluida o ausente. No se rompe nada estructural.

### 1.3 Tres relaciones, dos mecanismos

| relación | criterio | mecanismo |
|---|---|---|
| la misma fila | misma clave `fichero|línea|tipo` | fusión ADR-071: persistida, marcada, la más antigua sobrevive |
| el mismo defecto en filas distintas | misma causa raíz; línea o tipo distintos | **ninguno** (hueco) |
| la misma clase | mismo tipo, en cualquier sitio | hermanos: prosa efímera al analista |

Fundir es «esta fila ES aquella». Agrupar es «filas distintas, relacionadas».
El hueco es el medio, y **no se cierra ensanchando la fusión**: fundir por
fichero y símbolo borraría defectos reales distintos. Medido:
`create-checkout/index.ts`, símbolo `serve`, tiene 7 filas en 6 líneas con 6
tipos distintos. La gemela a 3 líneas del backfill fue una heurística de
migración, no un mecanismo de producción.

Lo que la fila guarda: fichero, línea, tipo, símbolo, título, severidad. Lo que
no guarda: los ejes `alcance`, `efecto` y `estado` que el escáner emite, que
solo derivan la severidad. No existe «relacionado con» ni causa raíz.

## 2. DECISIÓN — Corte 1: sede antes que clase, y «otro» no agrupa

Los hermanos siguen siendo contexto para el analista y nada más. Cambia **qué
se cita y en qué orden**:

1. **Primero, la misma SEDE**: mismo fichero y mismo símbolo, **sin mirar el
   tipo**. Si el hallazgo o el otro no llevan símbolo (67 de 520 abiertas),
   misma sede es mismo fichero a 3 líneas o menos, la oscilación medida del
   escáner entre corridas (62 de 62 gemelas del paso A cayeron a 3 líneas o
   menos, 52 en la línea exacta). Dentro de la sede, el más cercano por línea
   primero; a igual distancia, el más antiguo. Son los **candidatos a ser el
   mismo defecto**, y así se le dicen al analista.
2. **Después, la misma CLASE**: mismo tipo en otra sede, **marcada como tal**:
   «probablemente defectos distintos; no los arregles ni los cites como where».
   Primero los del mismo fichero, luego por urgencia como hoy.
3. **`otro` no es una clase**: un hallazgo `otro` no recibe hermanos por clase
   ni se cita como hermano por clase. Sí entra en la sede: la sede no mira el
   tipo (la fila `otro` de `send-invoice:268` es sede de la de la 258).
4. **Se citan 5 como hoy**, pero los 5 más relevantes: la sede llena primero;
   la clase, lo que quede. El texto dice cuántos quedan sin citar de cada uno.

El analista sigue diciendo en `notes` si son el mismo defecto: ese juicio no
se persiste todavía (corte 2).

**Lo que se toca**: `hermanos-del-hallazgo.ts` y su test; `Hermano` recibe
`simbolo` y `firstSeen`; `estudiar-con-memoria.ts` los pasa al armar
`abiertos`; la línea del prompt que inserta el bloque. **Lo que no se toca**:
el escáner (el contrato no emite relaciones), el sync y la identidad de
ADR-084, la UI y el Historial (cero usos), el esquema de la base.

**Aceptación**: test rojo → arreglo → mutante → gate 5/5. Tests: la sede se
cita antes que la clase; `otro` queda excluido de la clase y no de la sede; el
símbolo decide la sede; sin símbolo decide la distancia; los 5 citados son los
relevantes y no los más graves; la clase se marca como tal. Mutantes que deben
morir: volver al orden por gravedad; incluir `otro` en la clase; ignorar el
símbolo. La función **no es una defensa** —es contexto, no un control— y no
entra en la lista innegociable; si el operador la quiere ahí, se añade sin
regex nueva.

## 3. Lo que NO está en este ADR (trabajo futuro, con su razón)

- **Corte 2 — persistir el juicio «mismo defecto»**: exige un campo
  estructurado en la respuesta del analista y un sitio en la base, y hoy no hay
  consumidor que lo lea (ni Historial ni selector). Se hace cuando exista el
  consumidor, para no guardar datos que nadie mira.
- **Corte 3 — la raíz de la deriva del tipo, en el sync**: casar por sede antes
  de abrir fila nueva evitaría las seis filas de `send-invoice`. Toca la
  identidad de ADR-084 y el «nada muere sin juicio» de ADR-065: arco propio,
  con su ADR, y antes hay que medir si la deriva sigue tras la regla de
  elección de ADR-081 (las seis filas son anteriores o contemporáneas a ella).
- **El hueco «mismo defecto en filas distintas»** sigue abierto hasta los
  cortes 2 y 3. Mientras, la única mitigación es la sede bien citada más las
  `notes` del analista.
- **El índice de ADRs** (`docs/DECISIONS/README.md`) no tiene fila para 091 a
  098, y el 094 no existe. Queda **ANOTADO como deuda de documentación** en
  `docs/DEUDAS.md`, no arreglado en este arco (firmado).

## 4. Alternativas consideradas

- **Fundir por fichero y símbolo** — RECHAZADA: borra defectos reales
  distintos (`create-checkout`, `serve`, 6 tipos en 7 filas).
- **Ensanchar la gemela (3 líneas) a producción como fusión** — RECHAZADA por lo
  mismo: dos defectos en líneas contiguas son dos filas (ADR-084 lo decidió).
- **Agrupar por título** — RECHAZADA: el título se redacta distinto cada vez
  (la razón original de agrupar por clase, `a947302`).
- **Quitar los hermanos** — RECHAZADA: el backlog muestra que el analista los
  usa para reconocer el gemelo real cuando se lo citan.
- **Convertir `otro` en clases nuevas (accesibilidad, privacidad)** — FUERA de
  este corte: es la sub-pieza del vocabulario del arco #3.

## 5. Consecuencias

- **Positivas**: el analista ve primero al gemelo real (send-invoice: las seis
  se ven entre sí); desaparece el ruido de `otro` (34 citas «y 28 más» en
  Omega pasan a cero por clase); menos tokens descartando ajenos.
- **Negativas**: un mismo defecto en dos ficheros con tipos distintos sigue sin
  verse; una fila `otro` pierde el contexto por clase que ya era ruido.
- **Neutras**: nada nuevo se persiste; el juicio sigue en prosa en el backlog;
  la fusión de ADR-071 no cambia.

## 6. Referencias

ADR-012, ADR-065, ADR-067, ADR-071, ADR-081, ADR-084, ADR-088 · ROADMAP §3 «El
contrato del hallazgo» · medición del 2026-09-22 (memoria del operador,
`fortress-backfill-98-zombis-medido` y la de esta sub-pieza) · commit `a947302`.

## 7. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta: las
marcó el 2026-09-22 por orden del operador, con su línea literal:

> *«YO JOJO dueño de proyecto FORTRESS firmo = firmo ADR-099: sede a 3 líneas,
> función fuera de innegociables, índice de ADRs anotado como deuda, leído —
> Jojo, 22 septiembre 2026»*

1. **La sede sin símbolo:** [x] mismo fichero a 3 líneas o menos · [ ] solo
   mismo fichero · [ ] otra: ________
2. **`hermanosDelHallazgo` en la lista innegociable:** [ ] sí · [x] no: es
   contexto, no una defensa
3. **El índice de ADRs (sin fila para 091-098; el 094 no existe):** [x] anotado
   como deuda de documentación en `docs/DEUDAS.md`, no se arregla en este arco ·
   [ ] se arregla aquí
4. **He leído §1.1 y §2.** [x]

**Firma del operador:** Jojo, dueño del proyecto FORTRESS · **Fecha:** 22 septiembre 2026
