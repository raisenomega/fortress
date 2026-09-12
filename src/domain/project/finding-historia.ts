import type { Severity } from '../shared/severity'

/**
 * Un hallazgo ya cerrado, tal como se lee en su historia (ADR-087).
 *
 * Aparte de `FindingMemory` a proposito. Aquel es «lo que el MOTOR necesita
 * para decidir con historia» y lo consumen diez sitios que no pintan nada;
 * meterle los campos del cierre para una pantalla los cargaria a todos con un
 * dato que ninguno usa. Cada pregunta, su proyeccion — como `SELECT_BY_PROJECT`
 * y `COUNTS_BY_PROJECT` ya son dos consultas sobre la misma tabla.
 *
 * Lleva el `extinctReason` CRUDO y no su clase. La clase es DERIVADA
 * —`clasificarExtincion` la calcula donde se pinta, igual que
 * `confirmadoPorUltimoEscaneo` se calcula en la fila— y guardarla aqui seria
 * una segunda copia de una verdad que ya esta en el motivo. Ademas el motivo
 * crudo lleva algo que la clase pierde: de QUIEN es la fila que absorbio a esta.
 */
export interface FindingHistoria {
  readonly id: string
  readonly severity: Severity
  readonly title: string
  readonly file: string
  readonly line: number | null
  /** Cuando se vio por primera vez. Las 55 la tienen. */
  readonly firstSeen: string
  /**
   * Cuando se cerro, o `null`.
   *
   * NULL en las veinte de fusion, y es deliberado: «se fusiono, y un
   * `resolved_at` afirmaria lo que no paso». La pantalla lo dice, no lo rellena.
   */
  readonly resolvedAt: string | null
  readonly extinctReason: string | null
  /** Quien pidio el juicio: `agente` la cola, `operador` la verificacion. NULL
   *  en las 55 de hoy — la columna nacio despues que ellas. */
  readonly extinguidoPor: string | null
}
