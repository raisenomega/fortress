/**
 * Un pedazo de codigo con sentido arquitectonico, que el escaneo audita ENTERO
 * y de una vez (ADR-082). La unidad del recorrido: se termina o no se empieza,
 * nunca se queda a mitad.
 */
export interface Parada {
  /** Ruta relativa de la carpeta que agrupa, o `.` para la raiz del proyecto. */
  readonly carpeta: string
  /** Los ficheros de fuente que le tocan, en rutas relativas a la raiz. */
  readonly ficheros: readonly string[]
}

/**
 * Lo que el reconocimiento midio ANTES de escanear nada: cuantas paradas hay y
 * cuantos ficheros suman. Es el numero con el que el escaneo se compromete
 * —las XX paradas se completan todas— y contra el que se declara la cobertura
 * al cerrar (Enmienda 2).
 */
export interface Manifiesto {
  readonly paradas: readonly Parada[]
  /** La Y de «audite X de Y ficheros». Suma exacta de las paradas. */
  readonly ficherosTotal: number
}

export const MANIFIESTO_VACIO: Manifiesto = { paradas: [], ficherosTotal: 0 }
