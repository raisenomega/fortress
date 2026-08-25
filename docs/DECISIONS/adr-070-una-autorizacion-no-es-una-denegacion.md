# ADR-070: Una autorización no es una denegación — el veredicto se lee de `allowed`, no de si hay texto

- **Fecha:** 2026-08-24
- **Estado:** Aceptada
- **Área:** Motor · Libro de la Vida

## Contexto

`PolicyEvaluation` documenta su propio campo en el tipo:

```ts
/** Por que NO se integra sola, o null si si. */
readonly reason: string | null
```

La firma humana no pasa por el cerco a propósito
([ADR-060](adr-060-auto-merge-loop.md)), así que asienta una evaluación
sintética en su lugar. Esa evaluación ponía `allowed: true` **y**
`reason: 'firma humana'`: una autorización con un porqué **afirmativo**, en un
campo que documenta el porqué de un rechazo.

Y `motivo` preguntaba por el texto en vez de por el permiso:

```ts
if (d.policy.reason !== null) return `politica — ${d.policy.reason}`
```

Resultado medido sobre el Libro de la Vida del repositorio:

| asientos `kind='merge'` | n |
|---|---|
| «Integracion automatica denegada por politica — **firma humana**» | 13 |
| …de esas, **con `commit=` que está en `main`** | **11** |
| que citan un fallo de git (`git —`) | **0** |

**Once asientos dicen "denegada" sobre integraciones que están en `main`**, con
el sha en su propia evidencia al lado. Entre el 2026-08-23 y el 2026-08-24.

La capa de aplicación ya preguntaba bien —`if (!policy.allowed)` en
`auto-merge-proposal`— así que el mismo dato tenía **dos predicados y solo uno
era correcto**.

**El bug gemelo.** Cortar en esa línea dejaba inalcanzable el fallo de git, tres
condiciones más abajo: un merge firmado que muere aplicando salía por
«política» y su error no se escribía en ninguna parte. Las **dos** restantes de
las 13 son exactamente eso —firmas que fallaron en git— y por eso el Libro
entero tenía **cero** asientos citando a git.

Es la forma de [ADR-059](adr-059-capas-de-estado-no-heredan.md) aplicada a un
solo campo: **la razón estaba decidiendo el qué**.

## Decisión

**El predicado pregunta por `allowed`.** Tener texto no es haber sido denegado.

**`FIRMA` deja de abusar del campo:** `reason: null`. Sanear solo el predicado
habría arreglado el síntoma y dejado la trampa armada para el siguiente que
escriba una razón afirmativa en un campo que documenta lo contrario.

**La vía entra en el asiento.** El asunto del commit y el Libro de la propuesta
ya distinguían firmada de automática —se arregló el 2026-08-22, cuando dos
merges firmados quedaron escritos como automáticos—; este era **el tercer
registro del mismo hecho** y el único que seguía diciendo «automática» también
de lo que firmó un humano. Sin él, arreglar el predicado cambiaba una mentira
por otra. `ViaDeIntegracion` baja al dominio para que el asiento pueda nombrarla.

**El veredicto no se toca.** Esta decisión corrige el motivo y el relato; qué
verdicto merece un asiento es otra cosa.

## Consecuencias

- La primera integración firmada tras el arreglo asentó
  «Integracion **firmada** aplicada: MEDIUM, 23 lineas en 2 archivo(s)» con
  `verdict: ok`. Es el primer asiento de integración aplicada del proyecto.
- **El histórico no se corrige.** El Libro es append-only por diseño: el puerto
  `OmegaLog` no tiene método de edición, y quitarlo fue deliberado. Los once
  asientos seguirán diciendo «denegada». Queda como deuda abierta, y lo que hay
  que decidir no es el arreglo sino **cómo se anota una rectificación en un
  registro eterno**.
- **La integridad del panel estaba lastrada.** Se calcula como
  `oks / (oks + discrepancias + vetos)`: con los datos de hoy da **60 %**, y con
  esos once contados como lo que fueron daría **75 %**. Quince puntos que el
  operador llevaba leyendo de menos.
- El fallo de git de una firma vuelve a ser registrable. No había forma de
  auditarlo antes porque no había forma de escribirlo.
- Ningún test existente cambió de resultado: los `PolicyEvaluation` de las
  pruebas eran `allowed: true` con `reason: null`, o `allowed: false` con razón,
  y para ambos los dos predicados coinciden. `FIRMA` era el único valor del
  sistema que los separaba, y **ningún test lo construía**. Por eso vivió seis
  días.

## Código

`src/domain/omega/merge-decision-text.ts` ·
`src/domain/omega/merge-decision.ts` ·
`src/domain/repair/via-de-integracion.ts` ·
`src/application/repair/firmar-integracion.ts` ·
`src/application/repair/apply-auto-merge.ts` ·
`src/application/repair/auto-merge-gather.ts` ·
`src/application/repair/via-de-integracion.test.ts` ·
`src/application/repair/firma-fallida-en-git.test.ts`
