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
