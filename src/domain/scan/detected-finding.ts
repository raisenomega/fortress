import type { Severity } from '../shared/severity'
import type { Alcance, Efecto, Estado } from './ejes-de-severidad'
import type { TipoDeDefecto } from './tipo-de-defecto'

/**
 * Hallazgo tal y como lo reporta un escaneo, antes de guardarse. No tiene id
 * porque lo asigna la persistencia: el escaner describe el problema, no la fila.
 */
export interface DetectedFinding {
  /** La banda que MANDA: derivada de los tres ejes cuando los hay (ADR-080), o
   *  la que dijo el modelo cuando no. */
  readonly severity: Severity
  readonly title: string
  /** Ruta relativa a la raiz del proyecto. Vacia si el hallazgo es global. */
  readonly file: string
  readonly line: number | null
  /**
   * La CLASE de defecto, elegida de un vocabulario cerrado. Junto al fichero y
   * al simbolo forma la identidad estable: el titulo se reescribe en cada
   * corrida, esto no. Ausente en los hallazgos que no vienen de un escaner.
   */
  readonly tipo?: TipoDeDefecto
  /**
   * La funcion o bloque que contiene el defecto (`handleVerify`, `buildEnv`).
   * Es lo que separa dos defectos del mismo tipo en el mismo fichero, y lo
   * unico de la ubicacion que sobrevive a que el codigo de arriba crezca — la
   * linea de un mismo agujero viajo de la 43 a la 59 en tres escaneos.
   * Vacio cuando no hay codigo que nombrar (una etiqueta de index.html).
   */
  readonly simbolo?: string
  /** Los tres ejes de ADR-080. Ausentes en las filas anteriores al ADR y en los
   *  hallazgos que no vienen de un escaner. */
  readonly alcance?: Alcance
  readonly efecto?: Efecto
  readonly estado?: Estado
  /** Lo que el modelo dijo por su cuenta, conservado como evidencia cuando la
   *  banda que manda es la derivada. */
  readonly severidadDelModelo?: Severity
  /** El bloque vino sin ejes, o con uno fuera del vocabulario: la severidad es
   *  la palabra del modelo, sin derivar. */
  readonly sinEjes?: true
  /** Tipo de auditoria (ADR-103): los ejes de seguridad no le aplican y manda
   *  la palabra del modelo. Aparte de `sinEjes`, que mide la calibracion. */
  readonly ejesNoAplican?: true
}
