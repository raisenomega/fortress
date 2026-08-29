# ADR-073: El freno del reindexado va en el embudo, no en el handler

- **Fecha:** 2026-08-27
- **Estado:** Aceptada
- **Área:** Grafo · Reindexado

## Contexto

El circuit breaker de la Capa 4 marca un proyecto CONTAMINADO cuando una
auditoría lo deja alterado y las capas de restauración no lo devuelven
byte-idéntico. `guardRun` y `guardMerge` lo consultan y frenan cualquier acción.

El **reindexado del grafo no lo consultaba**. Un proyecto marcado se reindexaba
igual por sus tres puertas: al arrancar la aplicación, al pulsar el chip del
grafo, y al cambiar de proyecto activo.

Una propuesta anterior del propio motor —`20050a`— nombró el agujero y propuso
taparlo. Su hallazgo apuntaba a `graph-reindex-handlers.ts:8`, y su fix ponía el
freno **ahí**. El analista escribió que el arreglo más ancho *«debe asumirse a
conciencia, no como efecto colateral»*, y no se integró.

## Decisión

El freno vive en **`loQueHayQueReconciliar`**, el módulo de precondiciones que
`reconcileGraph` consulta antes de decidir nada. Una sola comprobación, y cubre
las tres rutas y cualquiera que venga:

```
reconcileAllOnBoot ─┐
graph:reindex ──────┼─→ reconcileProject → reconcileGraph → loQueHayQueReconciliar
projects:focus ─────┘
```

Salta con `'SKIPPED'` y su línea de registro, como las otras dos precondiciones
—proyecto inexistente, sin repositorio git—. No inventa vocabulario: la salida
y el formato del log ya existían.

Se mira **antes** que el HEAD a propósito: leerlo lanza git, y un proyecto
bloqueado no merece ni el proceso.

## Alternativas descartadas

### En el handler, como proponía `20050a`

Cubre dos rutas de tres. Deja abierta la del **arranque**, que es la más
silenciosa: nadie está mirando cuando la aplicación se abre, y es justo la que
reindexa **todos** los proyectos. Tapar dos tercios de un agujero y darlo por
cerrado es peor que no tocarlo, porque nadie vuelve a mirar.

### Copiar `guardRun` entero

Es el guard de los otros canales del grafo, así que parecía el molde. No lo es:
`guardRun` hace **tres** cosas —consulta el breaker, mira el tope diario, y
**reserva el carril**— y aquí solo vale la primera.

El reindex no gasta un token: corre el binario del grafo, no un agente. Traer el
tope diario bloquearía el reindexado al agotar el presupuesto, un comportamiento
que nadie pidió. Y el carril reservado exige un `endRun` que aquí no tendría
quién lo soltara: el trabajo se va a una cola en segundo plano.

De ese guard aquí sirve la pregunta, no el guard.

## Consecuencias

- Un proyecto contaminado deja de reindexarse por las tres puertas.
- **No condena**, y esa es la diferencia con el intento anterior. `contaminated`
  se relee en cada llamada, así que en cuanto el operador desbloquea —la llave
  que llegó ese mismo día— la siguiente reconciliación entra sin más.
- El hallazgo de `20050a` **no queda cerrado por esto**: apunta al handler, que
  no cambia, así que su evidencia no cuadraría y como mucho quedaría mitigado.
  Tapar el agujero y retirar el hallazgo son dos actos.

## La lección: una defensa latente exige que la prueba sea el instrumento

Con **cero** proyectos contaminados, el freno no produce ninguna señal
observable: ni en la aplicación, ni en el registro, ni en el arranque. No hay
nada que mirar para saber si funciona, y no lo habrá hasta el día en que haga
falta — que es el día en que ya es tarde para descubrir que no.

Por eso la prueba se escribió **antes** y se vio caer: sin el freno, un proyecto
contaminado devuelve `STARTED` y arranca el indexado. Aquí la prueba no es una
red bajo el trabajo: es el único instrumento que lo mide.

## Referencias

- `0e8567f` — el freno y la extracción de las precondiciones.
- [ADR-069](adr-069-cerco-mide-el-fichero-antes-de-integrar.md) — el otro caso
  de una mitad sin cubrir que se nombró antes de manifestarse.
- [FLOWS/GRAPH-REINDEX](../FLOWS/GRAPH-REINDEX.md) — las tres rutas y su matriz.
