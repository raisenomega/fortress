# ADR-068: El tope por propuesta mide trabajo, no contexto releído

- **Fecha:** 2026-08-23
- **Estado:** Aceptada
- **Área:** Motor de reparación · Presupuesto
- **Refina:** [ADR-014](adr-014-presupuesto-duro-por-propuesta.md)

## Contexto

El techo de 2.000.000 de tokens por propuesta contaba `cache_read`: el mismo
contexto entrando otra vez en cada vuelta, al décimo del precio del input. Así
no medía trabajo, medía **contexto × turnos**.

Los cuatro rechazos por presupuesto de agosto lo prueban. Entre el **93% y el
96%** de lo que reventaba el tope era re-lectura:

| propuesta | cobrado | trabajo real | % del tope |
|---|---|---|---|
| a3c0b2 | 2.284.142 | 144.810 | 7,2% |
| 05548b | 2.020.657 | **128.364** | 6,4% |
| a33457 | 3.863.700 | 190.397 | 9,5% |
| 47355b | 3.675.387 | 213.478 | 10,7% |

El que parecía perderse «por un 1%» había hecho 128.364 de trabajo. Y no eran
propuestas fallidas: el orden del código es *hay diff → está en scope →
presupuesto → commit*, así que el fix estaba escrito, con su test y dentro de su
perímetro cuando se tiró. Dos de esos worktrees conservaban el trabajo hecho.

## Decisión

**El tope mide `input + output + cache_creation`.** La creación de caché entra
porque es la primera vez que ese contexto se procesa y se paga por encima del
input: es trabajo hecho una vez. La re-lectura no.

La re-lectura **no se pondera por su precio** a propósito: eso sería una tabla
de precios dentro del código, que es justo lo que `token-usage` se niega a
mantener porque se queda vieja y miente.

`totalTokens` **no cambia**: el pie y Rendimiento siguen contándolo todo, que es
otra pregunta. Por eso el Libro de vida dice «tok de trabajo» — son dos cifras
distintas y restarlas no significa nada.

**El generador lleva `--max-turns 30`**, que es lo que inflaba la re-lectura.
Sale de los datos: las corridas que completaron el fix dieron 4-25 vueltas y las
cuatro que reventaron dieron 32, 35, 44 y 50.

El **analista NO lo lleva**, deliberadamente: sus vueltas no distinguen a unas
de otras (15-25 y 18-25), y un análisis truncado sale como JSON a medias, que
acabaría en el desenlace que [ADR-066](adr-066-analisis-ilegible-no-es-obsoleto.md)
existe para no fabricar.

Al agotar los turnos, desenlace **propio**: `turnos_agotados`, «no completó en 30
turnos». No presupuesto, que mandaría a buscar una causa que no existe, ni avería
del generador, que haría al loop reintentar para siempre contra un techo que
funcionó. No se reintenta, por la misma doctrina que el presupuesto y los
timeouts. El worktree se conserva: hay medio fix que mirar.

## Consecuencias

- Los cuatro rechazos históricos pasarían usando como mucho el 10,7% del tope.
- **`num_turns` y el contador que `--max-turns` limita NO son el mismo número.**
  Tras el techo se observaron corridas que completaron reportando 43 y 36
  `num_turns`, y una que se agotó reportando 31. La calibración se hizo contra
  `num_turns` y ese contador no es el que el flag acota; el techo empíricamente
  no está cortando fixes que terminarían, pero **subirlo sin medir sería mover
  un dial a ciegas**.
- El `patternId` de COGNITION queda congelado sobre su fórmula vieja
  (`severidad │ fichero │ título`) pese al cambio de identidad de
  [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md). No es un compromiso: el
  log solo persiste severidad y título, así que la clave nueva le sería
  inservible, y cambiarla dejaría huérfana cada entrada ya escrita.

## Código

`src/domain/repair/budget.ts` · `src/infrastructure/repair/generator-args.ts` ·
`src/infrastructure/repair/generator-outcome.ts` · `src/domain/cognition/pattern-id.ts`
