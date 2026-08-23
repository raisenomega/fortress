# ADR-066: Un análisis que no se deja leer no es un hallazgo obsoleto

- **Fecha:** 2026-08-23
- **Estado:** Aceptada
- **Área:** Motor de reparación · C2 (análisis)

## Contexto

Cuando el JSON del analista llegaba truncado, el `Analysis` salía con estado
desconocido. Desconocido no es accionable, así que caía por el único lado que
quedaba: `OBSOLETO` → `CADUCADO` → «el hallazgo ya no existe».

El analista **sí** había dictaminado. Lo que falló fue leer su respuesta.

Mentía dos veces. En el Libro, que asentaba la caducidad en fase `EXPIRE` como
si el problema se hubiera ido. Y en la cola, porque el descuento por `base_sha`
se llevaba el hallazgo sin que nadie lo hubiera resuelto: se pagaba el análisis,
se perdía el hallazgo y no quedaba rastro de que la causa fue un parser.

Se observó tres veces en dos días, con colas de JSON como `} ]}`, `]` y una
vacía. Uno de los tres ni siquiera registró factura.

Es la misma familia que la parada humana registrada como error
([ADR-061](adr-061-modo-autonomo-con-la-disciplina-del-motor.md)) y el merge
firmado escrito como automático: **un estado que no puede expresar el fallo hace
que el fallo parezca otra cosa.**

## Decisión

El reparto del veredicto es de **TRES**, y vive en una función del dominio que
usan los dos caminos que lo tenían duplicado — el análisis y el reintento:

| lo que pasó | veredicto | estado | fase en el Libro |
|---|---|---|---|
| el analista dice que existe | `REAL` | `ANALIZADO` | ANALYZE |
| el analista dice que ya no | `OBSOLETO` | `CADUCADO` | EXPIRE |
| no se pudo leer su respuesta | `ILEGIBLE` | `RECHAZADO` | ANALYZE |

**Lo ilegible se mira PRIMERO.** No es una tercera opinión: es la ausencia de
opinión legible, y preguntarle a `isActionable` qué opina de un texto que no se
pudo parsear solo puede dar una respuesta inventada.

`RECHAZADO` y no `CADUCADO` porque es lo que el dominio entiende por rechazo
—no llegó a `GENERADO`— y porque caducar significa que el hallazgo se fue.

## Consecuencias

- El hallazgo **no se silencia**: la consulta del descuento exige
  `analysis_verdict = 'OBSOLETO'`, y este es `ILEGIBLE`.
- Se reintenta **una vez**. Entra en los reintentables por el criterio de
  [ADR-028](adr-028-reintento-solo-razonamiento.md), no por su categoría: lo que
  no se dejó leer fue la respuesta de un modelo, que no es la misma dos veces.
  El tope de dos intentos por causa hace el resto — si vuelve a salir ilegible
  queda en pausa **visto como tal**, nunca como obsoleto.
- Es la otra mitad de por qué el analista **no** lleva techo de turnos: ver
  [ADR-068](adr-068-tope-mide-trabajo-y-techo-de-turnos.md).
- El parser codicioso no se tocó. Que lea mejor es otra deuda; esto es que
  cuando falle, lo diga.

## Código

`src/domain/repair/veredicto-del-analisis.ts` ·
`src/application/repair/plan-repair.ts` · `src/application/repair/retry-repair.ts`
