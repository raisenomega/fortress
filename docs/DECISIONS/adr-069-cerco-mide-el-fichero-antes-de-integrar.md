# ADR-069: El cerco mide el fichero antes de integrarlo, no después de romper `main`

- **Fecha:** 2026-08-24
- **Estado:** Aceptada
- **Área:** Motor · Integración automática

## Contexto

El gate corre **dentro del worktree de la propuesta**, anclado a su `base_sha`:
instalación limpia, typecheck, lint y tests sobre un árbol donde el fix está
solo. Da verde y nadie vuelve a medir nada. **El árbol integrado no lo mide
ninguna fase de la cadena.**

Eso no se notaba porque casi ningún fix se acerca a un límite. Este repositorio
tiene uno duro —75 líneas por archivo, verificado por ESLint en cada commit
([PRINCIPLES](../PRINCIPLES.md))— y una superficie inusualmente pegada a él.
Medido sobre `src/` el día de la decisión:

| tramo | archivos |
|---|---|
| exactamente 75 líneas | **23** |
| entre 70 y 74 | 69 |
| total de archivos | 1 341 |

Veintitrés archivos donde **una sola línea añadida rompe el lint del
repositorio**, y sesenta y nueve a menos de seis líneas de estarlo.

El incidente que lo destapó fue `claude-cli.ts`. Dos propuestas distintas,
generadas ambas desde `base_sha d2892536`, donde el archivo tenía 74 líneas:

| propuesta | rama | el archivo en su worktree |
|---|---|---|
| `f32a363b` — la API key se hereda al entorno | `3c5a0d0` | 74 → **75** |
| `507675a5` — el spawn no pasa `--strict-mcp-config` | `838c336` | 74 → **75** |
| — | merge `95ff055` | **76** |

Cada una era legal por separado y su gate lo confirmó. **La suma no lo era**, y
`main` quedó con el lint rojo hasta que se extrajo `buildEnv` a su propio módulo
para bajar el archivo a 62.

Ese incidente concreto tiene dos particularidades que conviene decir, porque
delimitan lo que esta decisión puede y no puede evitar: las dos propuestas
entraron **firmadas** —y la firma no pasa por el cerco a propósito
([ADR-060](adr-060-auto-merge-loop.md))— y cada worktree medía 75, que es legal.
Lo que el incidente demuestra no es que faltara esta condición: es que **nadie
mide el resultado**, y la puerta que no tiene ningún humano delante es la
automática.

## Decisión

Una **sexta condición** en el cerco de integración automática: si algún archivo
del fix quedaría por encima de `MAX_LINEAS_POR_FICHERO`, no se integra sola.

Va la última de las seis porque es la más cara: las otras cinco deciden con lo
que ya está en el expediente, esta necesita **leer cada archivo del worktree**.

- **Se mide el RESULTADO, no se estima.** El archivo del worktree ya tiene el
  fix aplicado; se cuenta con `wc -l`. El diff da totales del cambio —altas
  menos bajas— y de un agregado no sale el tamaño de ningún archivo concreto.
- **Se cuenta como cuenta ESLint**: líneas físicas, sin descontar blancos ni
  comentarios (`skipBlankLines: false, skipComments: false`). Contar de otra
  forma daría un veredicto que el lint desmiente.
- **Lo que no se deja leer se OMITE** del mapa en vez de contarse como cero. Un
  cero diría "cabe de sobra" sobre algo que nadie miró.
- **Frena, no rechaza.** Es una denegación de política —`esDenegacion`—, no una
  avería: la tanda sigue y el fix va a la firma humana, donde alguien puede
  partir el archivo antes de integrarlo.
- **Solo la puerta automática.** La firma no se toca: ahí hay un humano que miró
  el diff, y el cerco existe para lo que entra sin él.

`MAX_LINEAS_POR_FICHERO` se declara en el dominio, que no lee archivos de
configuración, y queda **duplicado** respecto a `eslint.config.mjs` a propósito.
Lo que impide que el duplicado envejezca es una prueba que compara los dos
números —los dos bloques del config incluidos— y falla si divergen.

## Consecuencias

- Un fix que por sí solo dejaría un archivo sobre el límite deja de
  auto-integrarse. Con veintitrés archivos en el filo, es el caso probable.
- **No cubre la suma de dos fixes concurrentes**, que es justo el incidente que
  la motivó: cada worktree mide legal y el conflicto solo existe en el árbol
  integrado. Cerrar esa mitad es **detección posterior a la integración**, no
  prevención, y es otra pieza.
- **No cubre el choque semántico.** Un fix que rompe el typecheck o un test del
  árbol integrado —sin tocar ninguna línea de más— pasa esta condición sin
  enterarse. Misma pieza pendiente.
- El coste de una evaluación sube: hay que leer del disco un archivo por cada
  uno que el fix toca. Es lectura local, sin modelo.
- La política gana un valor en su vocabulario cerrado de condiciones
  (`max-lines`), que el ciclo cuenta como denegación al medir rachas.

## Código

`src/domain/shared/limite-de-fichero.ts` ·
`src/domain/repair/auto-merge-evaluation.ts` ·
`src/application/repair/auto-merge-types.ts` ·
`src/infrastructure/repair/worktree-file-reader.ts` ·
`src/application/repair/motor-chain-outcome.ts` ·
`src/domain/repair/auto-merge-max-lines.test.ts` ·
`src/infrastructure/project/limite-de-fichero-propio.test.ts` ·
`src/application/repair/auto-merge-mide-el-arbol.test.ts`
