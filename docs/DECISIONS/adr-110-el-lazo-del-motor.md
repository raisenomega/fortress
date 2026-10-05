# ADR-110 — El lazo del Motor: persiste hasta completo, sin mitades

- **Estado**: Aceptada (firmada por el operador el 2026-10-01)
- **Alcance**: cuando OMEGA **aprueba** un fix diciendo que resuelve el hallazgo
  **PARCIALMENTE**, el Motor da **otra vuelta** del generador sobre la MISMA
  sesión (`--resume --fork-session`) con la objeción de OMEGA en el prompt, hasta
  COMPLETO o hasta parar. Añade **una arista** a la máquina de estados
  (OMEGA → GENERADO) y arregla `collectGateOutcome`, que leía el cierre del gate
  por posición. **Solo añade vueltas DENTRO de una propuesta, antes de la firma.**
- **No toca**: el perímetro (el Motor sigue siendo solo de FORTRESS, ADR-107), el
  DEBUT y las severidades (ADR-106), que OMEGA audite, la firma del operador como
  única vía de integración sobre el repo propio, ni el árbol vivo —todas las
  vueltas pasan en el worktree—.
- **Nace de**: la primera propuesta del Motor que llegó entera a la firma
  (`7998aa13`, 2026-10-01). OMEGA la aprobó con `resuelve_el_hallazgo: PARCIAL` y
  escribió qué faltaba; el Motor no tenía con qué recogerlo, y la mitad abierta
  terminó anotada a mano en DEUDAS §12.1.

## 1. La firma del operador

> «YO Jojo dueño del proyecto FORTRESS firmo ADR-110 (el lazo — el Motor persiste
> hasta completo, sin mitades): cuando OMEGA aprueba un PARCIAL diciendo qué
> falta, el Motor da otra vuelta con el generador (`--resume --fork-session`,
> recapturando el id cada vuelta), recibiendo el "falta X" de OMEGA en su prompt
> saneado, hasta COMPLETO o hasta parar. DOS paradas: convergencia por huella del
> diff (para cuando el generador repite, con el PARCIAL como desenlace, no fallo)
> y tope de vueltas = 2 (la red contra vueltas distintas-pero-malas, las más
> caras); los 2M de tokens quedan como última red. El freno en DÓLARES
> (`cost_usd`), no `trabajoReal` (porque `--resume` relee cada turno: +47%
> relectura, +355% con trabajo). Añado la arista en la máquina de estados
> (OMEGA→otra vuelta) y arreglo `collectGateOutcome` en el MISMO arco (lee el
> primer cierre de gate por posición —clase §13—; debe leer el de la vuelta
> correcta). Probado: `--resume` continúa en la caja clase A y la vuelta reanudada
> respeta la correa y el sandbox. NO toca el perímetro (Motor solo FORTRESS),
> DEBUT, que OMEGA audite, mi firma, ni el árbol vivo. Resuelve los PARCIAL cuya
> mitad cae DENTRO de la correa; los que piden más terreno esperan la correa de
> dependencias.»

## 2. Por qué el disparo es un eje dentro de un APROBADO

Por **D19** el veredicto sintético lo computa el motor, y `PARCIAL` **no veta**:
`computeGlobalVerdict` solo veta por los cuatro caminos duros. Así que el lazo
**no se dispara por un rechazo** —ese camino ya existe y es otro: `retryRepair`,
D24, propuesta nueva con análisis fresco— sino por `resuelve_el_hallazgo:
'PARCIAL'` **dentro de un veredicto aprobado**. Es la diferencia con
`hastaConverger` del Terminal, que reintenta cuando le vetan.

Y es la diferencia que importa: un PARCIAL aprobado **hoy sale a la firma como
está**. Firmarlo mitiga el hallazgo ENTERO —`marcarElHallazgoIntegrado` cuelga de
`MERGEADO`—, así que la mitad abierta deja de verse. El lazo existe para que esa
mitad se intente antes de que la firma la tape.

## 3. La arista: OMEGA → GENERADO, y no un estado nuevo

`NEXT` gana **una entrada**. Se eligió así, y no con un estado `OTRA_VUELTA`,
por tres razones medidas:

1. **El libro cuenta la verdad sin traducción**: `GENERADO → GATE → OMEGA →
   GENERADO → GATE → OMEGA` es literalmente lo que pasa. Un estado de tránsito
   no añade información, añade una palabra que hay que explicar.
2. **Ningún estado nuevo que repartir**: cada `Record<ProposalState, …>` del
   dominio tendría que crecer, y cada tabla exhaustiva es un sitio donde el
   siguiente olvido vive.
3. **El freno NO vive en la tabla.** La tabla dice qué es *estructuralmente*
   posible; cuántas vueltas se dan lo decide el lazo (§4). Mezclarlos haría que
   cambiar un tope exigiera tocar la máquina de estados.

`canTransition` sigue siendo el juez único, así que no hay ninguna otra puerta
que abrir.

## 4. Las dos paradas, y el orden en que muerden

| | parada | qué significa el desenlace |
|---|---|---|
| 1 | **la huella del diff se repite** | el generador da vueltas: una más dará lo mismo. Sale como **PARCIAL, desenlace**, nunca como fallo |
| 2 | **tope de vueltas = 2** | la red contra vueltas distintas-pero-malas, que son las más caras |
| 3 | **el freno en dólares** | última red por propuesta, antes de que el tope de 2M (que no ve el dinero) llegue a importar |

**CONVERGER NO ES UN CONTADOR**, y el orden lo respeta: la huella para por
**falta de progreso**, que es la razón buena; el tope de 2 para por **prudencia**,
y se dice distinto en el libro. Los **2 000 000 de tokens** por propuesta
(`MAX_TOKENS_PER_PROPOSAL`) quedan donde estaban, como última red: medido sobre
la `7998aa13`, la propuesta entera gastó **84 041**, el **4,2 %** — esa red
permitiría **~42 vueltas**, así que como freno de coste no frena nada.

## 5. El freno se mide en DÓLARES, y está medido por qué

`trabajoReal` **excluye `cache_read` a propósito** (el 93-96 % de lo que reventaba
el tope era relectura). Pero una sesión reanudada **relee la transcripción entera
cada turno**: el lazo multiplica exactamente lo que el tope dejó de contar.
Medido el 2026-10-01 con los flags reales del generador y el sandbox puesto:

| | vuelta 1 | vuelta 2 (`--resume`) | |
|---|---|---|---|
| mismo trabajo (1 turno) | $0,1749 | $0,2571 | **+47 %** |
| con edición (3 turnos) | $0,0914 | $0,4164 | **+355 %** |

Por eso el lazo suma `usage.costUsd` —el `total_cost_usd` que reporta el CLI, que
**no se calcula aquí**— y para si la vuelta siguiente pasaría del tope por
propuesta. El tope es **$5**: cinco veces lo que costó la propuesta real entera
($0,9674) y el **2 %** del tope de sesión que el operador tiene fijado ($250).
Es una red, no el freno: con el tope de vueltas en 2, nunca debería tocarse.

## 6. `collectGateOutcome`: la clase §13 otra vez

El lector del expediente tomaba `delGate.find(TRANSITION)` —**el PRIMERO**— y
recogía **TODOS** los `AGENT_RUN` de fase GATE. Con dos vueltas habría dos
cierres y ocho comandos: leería el cierre de la vuelta 1 **con los comandos de
las dos mezclados**, y eso es lo que el operador vería al firmar.

Es exactamente la lección de DEUDAS §13 —**un asiento se busca por lo que ES, no
por su POSICIÓN**— y se arregla en ESTE arco porque es la arista la que lo
convierte en un defecto real. El cierre que vale es el **último**, y sus comandos
son los de **su** vuelta: los que caen entre el cierre anterior y él.

`collectPostOmegaState` **no** necesita cambio: desde el arreglo del 1-oct busca
por motivo y toma el último, así que lee el veredicto de la última vuelta; y el
asiento del worktree se emite una sola vez, porque la vuelta reusa el worktree.

## 7. La frontera que el lazo NO cruza

La correa se calcula **una vez**, en `prepareWorktree`, desde el `file`
estructurado del hallazgo y los grupos que el proyecto declara. **OMEGA no entra
en ese cálculo.** Si la objeción pidiera terreno nuevo —«toca el lock»—, la
vuelta lo escribiría y `checkScope` la mataría con `scope_violation`, igual que
hoy. **El lazo resuelve los PARCIAL cuya mitad cae DENTRO de la correa**; los que
piden más terreno esperan la correa de dependencias, que es otro arco.

Verificado en vivo el 2026-10-01: la vuelta reanudada editó dentro de la correa
(`checkScope ok`), se negó a escribir fuera citando el bloque PERMITIDOS, y se
negó a leer `~/.bashrc` **nombrando la lista de lectura denegada del sandbox**.
Las tres capas llegan a la vuelta reanudada.

## 8. Consecuencias

- Un PARCIAL ya no sale a la firma sin que se intente su otra mitad.
- La factura por propuesta sube: una vuelta extra ≈ **$0,70** (generador
  reanudado + OMEGA), así que una propuesta con lazo cuesta ~**$1,7** en vez de
  ~$0,97, y el tope de sesión del operador se consume más rápido.
- El libro de una propuesta puede tener **dos vueltas**, y todo lector de fase
  GATE tiene que saberlo (§6).
- **Lo que no cambia**: quién integra. Un fix completado por el lazo sigue
  esperando la firma del operador exactamente igual.

## 9. Lo verificado EN VIVO al construirlo (2026-10-02)

**La decision, con el codigo real sobre el libro real de la `7998aa13`** —la
unica propuesta que llego con un PARCIAL de verdad— y en solo lectura:

```
huella de la vuelta 1 = 8b8a1daa82ae116b4016f767f208885ae0f642ed
huellas anteriores    = []          vueltas dadas = 1 (tope 2)
gastado               = $0,9674     (tope $5, margen $0,70)
resuelve_el_hallazgo  = PARCIAL
  con sesion -> { seguir: true }
  sin sesion -> { seguir: false, parada: 'sin-sesion' }
```

El lazo **habria disparado**, y el encargo que recibiria el generador mide 985
caracteres con la objecion literal del revisor dentro. Con el libro de **ayer**
la respuesta es `sin-sesion`: la sesion no se capturaba hasta hoy, y el lazo
**se niega a girar a ciegas** en vez de reintentar sin memoria.

**La vuelta, de verdad**, sobre un worktree temporal de `main`, con la correa
real y el sandbox puesto:

| | |
|---|---|
| vuelta 1 | 2 turnos, **$0,1037**, sesion `f3b4d9cc` |
| vuelta 2 (`--resume --fork-session`) | 8 turnos, **$0,2968**, sesion **nueva** `75974a55` |
| `checkScope` del diff | `{ ok: true, violations: [] }` |
| arbol vivo | intacto (`sucio=0`, HEAD sin moverse) |

**Y la vuelta NO cambio nada, diciendo por que:** «Lo que falta no se puede
cerrar bien dentro de `graph-binary.ts` y su test, y para dos de los puntos me
falta un dato que no he podido conseguir. Por eso no lo he forzado.» Es la
frontera del §7 apareciendo en el primer caso real: la mitad abierta de esa
propuesta —`--ignore-scripts` y el hash— **no es una edicion dentro de la
correa**, es una decision del operador, que es exactamente lo que DEUDAS §12.1
dice. El lazo lo trata como lo que es: `no_diff_produced`, el PARCIAL de la
vuelta 1 se conserva como desenlace y no se asienta nada falso.

**Lo que esto NO prueba, y conviene decirlo:** que un PARCIAL se vuelva COMPLETO.
Para eso hace falta un hallazgo cuya mitad abierta SI sea una edicion dentro de
la correa, y el unico PARCIAL real disponible no lo era. Coste de las dos
mediciones: **$0,4005**.

## 10. Enmienda (2026-10-05, ADR-115 B2): la segunda arista, GENERADO → GENERADO

**Pendiente de la firma del operador.** El §3 decía que `OMEGA → GENERADO` era
«la única que vuelve atrás». Desde esta enmienda hay **una segunda**, con las
mismas tres razones del §3 para no inventar un estado nuevo:

- **Qué la dispara:** un rojo **de código** del gate. Es decir, `gate_failed` en
  typecheck, lint o test:unit, que sea **propio** del fix (no el invariante de
  los heredados) y que traiga **líneas de error** (las que guarda ADR-115 A1).
  Sin líneas no hay nada que darle al generador, y se queda terminal.
- **Qué se queda terminal, como siempre:** `gate_timeout`, `npm_ci_failed`,
  `gate_sin_verificacion`, los bloqueos previos del gate (sin caja, sin
  confianza) y el invariante de los heredados.
- **El rechazo se APLAZA, no se deshace.** En ese caso el gate no escribe el
  RECHAZADO: devuelve el rojo y la propuesta se queda en GENERADO. El lazo da
  **una** vuelta del generador sobre su sesión, con un encargo propio que dice la
  verdad («tu fix NO pasa el gate en `<paso>`», más las líneas, saneadas y con
  las marcas neutralizadas), y el gate se repite **ya sin aplazar**. Si no hay
  vuelta, o la vuelta no deja un fix, se escribe el rechazo aplazado, **idéntico**
  al de siempre. **Un RECHAZADO sigue sin salida**: no se reabre nunca.
- **Los topes son los del §4 y §5, compartidos.** Es el mismo `decidirOtraVuelta`
  sobre las mismas cuentas del libro: vueltas dadas (contando la primera), huella
  repetida y dólares. Un rojo no trae presupuesto propio, así que un rojo y un
  PARCIAL se reparten la única vuelta extra.
- **Solo lo pide la cadena del Motor.** El botón «Gate» manual de la app sigue
  rechazando el rojo como siempre.

**Deuda que deja, cosmética:** si la app muere en mitad de esa vuelta, la
propuesta queda en GENERADO y al arrancar `decideOrphan` la cierra en CADUCADO
con la etiqueta «worktree ausente», que no es la causa. No deja nada vivo, pero
la etiqueta engaña. Darle una honesta no es trivial: `decideOrphan` no sabe si un
GENERADO murió en una vuelta o en otro momento, y cambiarla afectaría a todos los
huérfanos en GENERADO.
