import type { ModuloAuditoria } from './modulo-auditoria'

/**
 * Un pedazo de codigo con sentido arquitectonico, que el escaneo audita ENTERO
 * y de una vez (ADR-082). La unidad del recorrido: se termina o no se empieza,
 * nunca se queda a mitad.
 */
export interface ParadaDeCarpeta {
  readonly clase: 'carpeta'
  /** Ruta relativa de la carpeta que agrupa, o `.` para la raiz del proyecto. */
  readonly carpeta: string
  /** Los ficheros de fuente que le tocan, en rutas relativas a la raiz. */
  readonly ficheros: readonly string[]
}

/**
 * Una dimension del proyecto ENTERO, auditada de una pasada (ADR-083, Fase 3).
 * M2 pregunta si se puede restaurar, M12 si se ve lo que pasa: ninguna vive en
 * una carpeta, y trocearlas por carpetas repetiria doce veces la misma
 * pregunta sobre doce doceavas partes de la respuesta.
 */
export interface ParadaDeTema {
  readonly clase: 'tema'
  readonly modulo: ModuloAuditoria
  /** Como se anuncia: «M2 DR/BCP — todo el proyecto». */
  readonly rotulo: string
}

/**
 * Las dos clases. El discriminante `clase` NO es decoracion: obliga a cada
 * sitio que hoy lee `carpeta` o `ficheros` a decir cual de las dos espera, y el
 * compilador señala los que se olvidaron. Sin el, una parada de tema con un
 * `carpeta` vacio se colaria por todos ellos sin que nadie protestara.
 */
export type Parada = ParadaDeCarpeta | ParadaDeTema

export const esDeCarpeta = (parada: Parada): parada is ParadaDeCarpeta => parada.clase === 'carpeta'

export const esDeTema = (parada: Parada): parada is ParadaDeTema => parada.clase === 'tema'

/**
 * Cuantos ficheros CUBRE una parada. Un tema mira el proyecto entero y cubre
 * CERO, que no es un descuido: cubrir es haber mirado una carpeta linea por
 * linea, y sumarle los ficheros del proyecto a cada tema daria coberturas por
 * encima del cien por cien. El numero jamas miente hacia arriba (ADR-082,
 * Enmienda 1). Lo que si suma un tema es una parada, que es la unidad comun.
 */
export const ficherosDe = (parada: Parada): number =>
  esDeCarpeta(parada) ? parada.ficheros.length : 0

/**
 * Como se nombra en el progreso. Cabe en el `carpeta: string` que el chunk ya
 * lleva al renderer: el puente no crece por esto —es innegociable— y «Parada 10
 * de 12 · M2 DR/BCP — todo el proyecto» se lee sin campo nuevo.
 */
export const rotuloDe = (parada: Parada): string =>
  esDeCarpeta(parada) ? parada.carpeta : parada.rotulo
