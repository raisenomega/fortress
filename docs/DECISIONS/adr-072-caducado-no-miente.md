# ADR-072: Retirar una propuesta la CADUCA — el estado dice que murió, la razón dice quién

- **Fecha:** 2026-08-27
- **Estado:** Aceptada
- **Área:** Motor · Máquina de estados

## Contexto

A una propuesta viva solo se la podía **avanzar**: firmar, reintentar, o esperar
a que el motor la caducara. La que no admitiera ninguna de las tres se quedaba
viva para siempre, y con ella su hallazgo fuera de la cola, porque uno con
propuesta viva no se re-elige ([ADR-059](adr-059-capas-de-estado-no-heredan.md)).

Había dos así en la base del operador. Una en `OMEGA` con un veredicto
persistido que la firma rechazaba, y otra de agosto en `ANALIZADO` cuyo proyecto
se había borrado debajo — ninguna acción del motor podía tocarla, porque todas
empiezan resolviendo el proyecto.

La transición no era el obstáculo: `canTransition` ya permitía `CADUCADO` desde
los seis estados vivos, y `OMEGA` además `RECHAZADO`. Faltaba **quién la
ejerciera**.

## Decisión

Retirar una propuesta viva la lleva a **`CADUCADO`**, con la razón
`retirada por el operador: <motivo>`.

El estado dice que murió; la razón dice quién la mató. Ese reparto ya es el del
sistema — `gate_failed_at=typecheck`, `omega_vetado` y `merge fallido` son todas
razones sobre estados compartidos.

`CADUCADO` no miente: el dominio lo define como *«la salida de emergencia de
todos los vivos»*, y una propuesta que el operador retira es exactamente una que
deja de tener validez.

## Alternativas descartadas

### `RECHAZADO` — miente **y** bloquea

Dos defectos, y el segundo es el grave.

El vocabulario reserva `RECHAZADO` al juicio de una **máquina**: el gate, OMEGA,
el generador. Aquí no juzgó ninguna.

Y `hasBlockingRejection` lo leería como un rechazo bloqueante:

```ts
if (ultima.state !== 'RECHAZADO' || ultima.baseSha !== headSha) return false
if (!isRetryable(ultima.state, ultima.analysisReason ?? null)) return true
```

`'retirada por el operador'` no está en `RETRYABLE_REJECTION_REASONS` —los cinco
son `omega_vetado`, `scope_violation`, `no_diff_produced`, `provider_error` y
`analisis_ilegible`—, así que `isRetryable` daría `false` y la función `true`:
el hallazgo quedaría **bloqueado**. Justo lo contrario de para lo que existe
retirar.

Con `CADUCADO` la primera línea devuelve `false` y el hallazgo queda libre por
construcción, no por suerte.

### Un estado nuevo `RETIRADO` — caro y redundante

Diría la verdad, pero `proposal.ts` está en **75/75** y no admite una línea.
Añadirlo arrastra `TERMINAL_STATES`, las consultas SQL que lo expanden,
`hasBlockingRejection`, `isRetryable`, los badges de la interfaz y sus pruebas:
un arco entero para decir lo que `CADUCADO` más una razón explícita ya dicen sin
ambigüedad.

## Consecuencias

- Una propuesta viva tiene salida, y su hallazgo vuelve a la cola al usarla.
- La historia no se borra: `advanceProposal` **anexa** el eslabón de cierre y el
  libro conserva los anteriores. Retirar no es olvidar.
- La decisión se asienta además en el Libro de la Vida con su motivo, con el
  veredicto que corresponde a un acto humano ([ADR-074](adr-074-el-asiento-no-afirma-mas-de-lo-que-sabe.md)).
- El caso de uso **no pide el proyecto ni el hallazgo**: retirar tiene que
  funcionar precisamente cuando ya no están, que es el caso de la huérfana.
- Lo que **no** hace es disponer del hallazgo. Que vuelva a la cola es
  consecuencia; decidir que tampoco procede es otro acto, y vive en el Escaneo.

La elección está fijada por la suite, no solo argumentada aquí: cambiar
`CADUCADO` por `RECHAZADO` en el caso de uso tumba tres pruebas.

## Referencias

- `231fbce` — el mecanismo (`retirarPropuesta`) y sus pruebas.
- `0fd9d1b` — el canal `repair:withdraw`.
- `fcf8e3e` — el botón y su confirmación.
- [ADR-065](adr-065-nada-muere-sin-juicio.md) — por qué un hallazgo no muere
  solo, que es la razón de que liberar y extinguir sean actos distintos.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la máquina de estados completa.
