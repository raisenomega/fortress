import { REPARTO_VACIO, type ParadaDeCarpeta, type Reparto } from './manifiesto'

/** La carpeta de la raiz, para los ficheros que no cuelgan de ninguna. */
export const RAIZ = '.'

/** Las carpetas de una ruta, sin el fichero. Vacio si esta en la raiz. */
const carpetasDe = (ruta: string): readonly string[] => ruta.split('/').slice(0, -1)

/**
 * Cuantos segmentos agrupan una parada, DEDUCIDO del manifiesto real. No es una
 * constante ni un parametro que el llamante adivine: la forma del proyecto ya
 * esta en sus rutas, y preguntarsela a quien llama seria pedirle que acierte
 * algo que se puede mirar.
 *
 * La senal es cuantos contenedores de codigo hay en la raiz:
 *
 * - UNO solo (`src/`, `apps/`, `lib/`) → dos segmentos. Ese contenedor no
 *   divide nada —todo cuelga de el—, asi que agrupar por el daria UNA parada
 *   con el proyecto entero, que es justo lo que el recorrido viene a partir.
 *   Las paradas de verdad estan un nivel mas abajo: `src/domain`, `apps/api`.
 * - VARIOS (`handlers/`, `models/`, `utils/`) → un segmento. Ahi la raiz ya
 *   divide, y bajar otro nivel partiria modulos que son una sola pieza.
 *
 * Los ficheros de la raiz no cuentan como contenedor: un `vite.config.ts` suelto
 * no convierte un proyecto de un solo `src/` en uno de raiz plana.
 */
export function profundidadDe(ficheros: readonly string[]): number {
  const contenedores = new Set(
    ficheros.map(carpetasDe).filter((carpetas) => carpetas.length > 0).map((carpetas) => carpetas[0]) // prettier-ignore
  )
  return contenedores.size === 1 ? 2 : 1
}

/**
 * La carpeta que agrupa a un fichero. Si sus carpetas no llegan a la
 * profundidad pedida se queda con las que tiene: un `src/a.ts` en un proyecto
 * de profundidad 2 cae en `src`, no en `src/a.ts`. Agrupar por un nombre de
 * FICHERO inventaria una parada por fichero.
 */
function carpetaDe(ruta: string, profundidad: number): string {
  const carpetas = carpetasDe(ruta)
  return carpetas.length === 0 ? RAIZ : carpetas.slice(0, profundidad).join('/')
}

/**
 * Reparte los ficheros de fuente en paradas por carpeta (ADR-082). Puro: no
 * toca git ni el disco, asi que la deteccion de profundidad se prueba con rutas
 * en memoria y no montando tres repositorios.
 *
 * El orden es ESTABLE (alfabetico por carpeta) para que dos manifiestos del
 * mismo arbol sean iguales. No es prioridad: cual va primero lo decide el
 * recorrido con la heuristica de nombres sensibles (Enmienda 1), y eso es otra
 * pieza.
 */
export function dividirEnParadas(ficheros: readonly string[]): Reparto {
  if (ficheros.length === 0) return REPARTO_VACIO

  const profundidad = profundidadDe(ficheros)
  const porCarpeta = new Map<string, string[]>()

  for (const fichero of ficheros) {
    const carpeta = carpetaDe(fichero, profundidad)
    porCarpeta.set(carpeta, [...(porCarpeta.get(carpeta) ?? []), fichero])
  }

  const paradas: ParadaDeCarpeta[] = [...porCarpeta.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([carpeta, suyos]) => ({ clase: 'carpeta', carpeta, ficheros: suyos }))

  return { paradas, ficherosTotal: ficheros.length }
}
