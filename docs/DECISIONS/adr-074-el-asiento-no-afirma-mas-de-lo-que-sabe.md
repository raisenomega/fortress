# ADR-074: El asiento no afirma más de lo que sabe — los actos del operador se registran como `info`, no como `ok`

- **Fecha:** 2026-08-27
- **Estado:** Aceptada
- **Área:** Motor · Libro de la Vida

## Contexto

Dos capacidades nuevas dejan constancia de una decisión **del operador** en el
Libro de la Vida: desbloquear un proyecto contaminado y retirar una propuesta
viva. Ninguna de las dos la toma una máquina.

El vocabulario de veredictos es cerrado y tiene cuatro valores:

```ts
export type OmegaVerdict = 'ok' | 'discrepancia' | 'info' | 'veto'
```

`'ok'` era el candidato obvio: es lo que usa `recordPushDecision` cuando algo
sale bien. Pero mirando **qué** afirma ahí, dice esto:

```ts
verdict: 'ok',
summary: 'Push autorizado: sin CRITICAL en el ultimo escaneo.'
```

Eso es una **comprobación**: el sistema contó los CRITICAL abiertos y no halló
ninguno. El `'ok'` no celebra el resultado, certifica una verificación.

## Decisión

Los actos del operador se asientan con **`verdict: 'info'`** y
**`agentId: null`**.

`'info'` es el valor que el dominio ya usa para *lo no verificable*
(`finding-check`: un hallazgo que no cita archivo se asienta `'info'` con el
texto «no verificable»). Es exactamente el caso: FORTRESS **no ha comprobado**
que el árbol esté limpio ni que la propuesta no procediera. Lo que ocurrió es
que un humano cargó con la decisión, y eso es lo único que el Libro puede
afirmar.

`agentId: null` por lo mismo: el campo está documentado como *«el agente
auditado, o null si es una nota del sistema»*, y aquí no hubo agente.

## Alternativa descartada: `'ok'`

Con `'ok'`, el Libro diría que algo salió bien **comprobado** en un asiento que
no comprobó nada. El daño no es de hoy: es de dentro de seis meses, cuando
alguien filtre los `'ok'` del Libro buscando verificaciones y encuentre entre
ellas decisiones humanas que nadie verificó. El registro dejaría de poder
responder «¿qué comprobó el sistema?» sin ambigüedad.

Un estado o un veredicto nuevo tampoco: el vocabulario es cerrado a propósito, y
`'info'` ya significa esto.

## Por qué merece un ADR y no un comentario

Porque **apareció dos veces el mismo día**, en dos arcos que no se hablaban
entre sí: el desbloqueo de contaminación (`d35cf6d`) y la retirada de propuestas
(`231fbce`). Cuando la misma elección se repite en dos sitios independientes, ha
dejado de ser un detalle de implementación.

La regla que generaliza: **el veredicto describe lo que el sistema verificó, no
lo que resultó**. Un acto autorizado por un humano no es una verificación con
resultado bueno; es una decisión sin verificación.

## Consecuencias

- Filtrar el Libro por `'ok'` sigue devolviendo solo lo que una máquina
  comprobó.
- Las decisiones humanas son localizables por su propio veredicto, con su motivo
  en `evidence` y sin agente que las atribuya mal.
- Ambos asientos son `kind: 'nota'`, la clase que el dominio reserva a lo que no
  es verificación, score ni merge.
- El Libro solo anexa: estas notas no se editan ni se borran. La decisión del
  operador queda escrita, y con ella el motivo que dio.

## Referencias

- `d35cf6d` — el asiento del desbloqueo, con el detalle forense por evidencia.
- `231fbce` — el asiento de la retirada, con el motivo del operador.
- [ADR-070](adr-070-una-autorizacion-no-es-una-denegacion.md) — el hermano de
  esta decisión: un campo que documenta un rechazo no puede llevar el porqué de
  una autorización. Los dos vienen de lo mismo — el registro no debe decir algo
  distinto de lo que pasó.
- [ADR-072](adr-072-caducado-no-miente.md) — la otra mitad de la retirada: el
  estado tampoco miente.
