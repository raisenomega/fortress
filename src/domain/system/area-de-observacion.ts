import { AREAS_DE_FALLO } from './areas-de-fallo'

/**
 * De QUE parte de FORTRESS habla una observacion. Vocabulario CERRADO, derivado
 * del corpus real y no inventado — molde de `tipo-de-defecto` (ADR-081).
 *
 * La derivacion, sobre las 350 observaciones del backlog al 2026-09-11: el campo
 * era texto libre y tenia **190 valores distintos**, 154 de ellos con una sola
 * observacion. Agrupados por SIGNIFICADO caen en doce clases, y siete cubren el
 * 91 %:
 *
 * | clase                   | obs | textos literales |
 * |-------------------------|-----|------------------|
 * | permisos-de-herramienta |  97 | 26               |
 * | consulta-del-grafo      |  75 | 38               |
 * | indice-del-grafo        |  52 | 39               |
 * | contexto-del-agente     |  34 | 24               |
 * | contrato-del-hallazgo   |  25 | 13               |
 * | ciclo-del-hallazgo      |  19 | 14               |
 * | identidad-del-hallazgo  |  16 | 10               |
 * | anclaje-del-hallazgo    |  13 | 10               |
 * | analisis-y-triaje       |  12 |  9               |
 * | motor-de-reparacion     |   2 |  2               |
 * | cognicion               |   1 |  1               |
 * | otro                    |   4 |  4               |
 *
 * Las 26 formas de escribir «permisos» —`permisos MCP`, `permisos-mcp`,
 * `permisos/mcp`, `permisos de Bash`, `sandbox de Bash`...— son UNA clase, y
 * ninguna sumaba a las otras veinticinco. Sin cerrar esto no hay deduplicacion
 * posible, y por tanto tampoco la senal que el backlog existe para dar: cuantos
 * PROYECTOS distintos se toparon con lo mismo.
 *
 * `motor-de-reparacion` y `cognicion` se conservan con una y dos: su escasez
 * dice que los agentes aun no trabajan ahi, no que la clase no exista. Plegarlas
 * a `otro` escondería ese hecho, que es justo lo que un backlog no debe hacer.
 *
 * `otro` al 4 % —frente al 33 % que ADR-081 midio en los tipos— es la prueba de
 * que estas clases salieron del corpus y no de una idea previa.
 */
export const AREAS_DEL_CORPUS = [
  'permisos-de-herramienta',
  'consulta-del-grafo',
  'indice-del-grafo',
  'contexto-del-agente',
  'contrato-del-hallazgo',
  'ciclo-del-hallazgo',
  'identidad-del-hallazgo',
  'anclaje-del-hallazgo',
  'analisis-y-triaje',
  'motor-de-reparacion',
  'cognicion'
] as const

/** Las once del corpus, las de FALLO —que crecen aparte y por otra regla
 *  (ADR-086)— y `otro` cerrando la lista ENTERA: el cajon recoge lo que no
 *  encaje, venga de un agente o de una rotura. */
export const AREAS_DE_OBSERVACION = [...AREAS_DEL_CORPUS, ...AREAS_DE_FALLO, 'otro'] as const

export type AreaDeObservacion = (typeof AREAS_DE_OBSERVACION)[number]

/**
 * Lo que llegue, convertido a una clase. Fuera del vocabulario cae a `otro` en
 * vez de inventarse una: molde `aTipoDeDefecto`, y por la misma razon — un
 * cajon declarado se puede contar y vigilar; un valor nuevo cada vez, no.
 *
 * NO traduce texto libre: `permisos MCP` cae a `otro`, no a
 * `permisos-de-herramienta`. Reconocer que aquello es esto exige juicio —el
 * 33 % del corpus viejo casa con dos clases a la vez— y adivinar aqui
 * clasificaria mal una de cada tres. Las 350 viejas esperan su backfill.
 */
export function aArea(value: unknown): AreaDeObservacion {
  return (AREAS_DE_OBSERVACION as readonly string[]).includes(value as string)
    ? (value as AreaDeObservacion)
    : 'otro'
}
