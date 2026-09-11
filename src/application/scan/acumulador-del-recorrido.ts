import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'
import { esDeTema, ficherosDe, type Parada } from '@domain/scan/parada'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { ScanOutcome } from '@domain/scan/scanner'
import { addUsage, EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'

/**
 * Lo que el recorrido va juntando parada a parada. Existe para que el bucle sea
 * legible: sin esto, seis variables sueltas y su aritmetica se mezclan con la
 * decision de seguir o parar, que es lo unico que ahi importa.
 */
export interface Acumulado {
  readonly reportados: readonly DetectedFinding[]
  readonly hechas: number
  /**
   * La COBERTURA, contada por manifiesto: los ficheros de las paradas que de
   * verdad se auditaron. Un hallazgo que apunte fuera de su parada NO la sube —
   * es real y se guarda, pero cubrir una carpeta es haberla mirado, no haberla
   * mencionado. Asi el numero jamas miente hacia arriba (ADR-082, Enmienda 1).
   *
   * Una parada de TEMA suma cero: mira el proyecto entero y no cubre carpetas.
   * Sumarle el total a cada tema daria mas del cien por cien, que es la misma
   * mentira dicha al reves. Los temas se cuentan en `hechas`, no aqui.
   */
  readonly cubiertos: number
  /**
   * Los modulos de TEMA cuya parada se completo. No los que APLICABAN: si el
   * operador para antes de llegar a ellos, aplicaban igual y no se auditaron, y
   * el informe tiene que poder decir esa diferencia.
   */
  readonly temas: readonly ModuloAuditoria[]
  readonly durationMs: number
  readonly usage: TokenUsage
  readonly tools: readonly string[]
  readonly edits: readonly string[]
  /** La transcripcion de todas las paradas, para que quede en disco al cerrar. */
  readonly texto: string
}

export const NADA_RECORRIDO: Acumulado = {
  reportados: [],
  hechas: 0,
  cubiertos: 0,
  temas: [],
  durationMs: 0,
  usage: EMPTY_USAGE,
  tools: [],
  edits: [],
  texto: ''
}

/** Suma una parada terminada. Nunca se llama con una que quedo a medias. */
export function sumarParada(previo: Acumulado, parada: Parada, salida: ScanOutcome): Acumulado {
  return {
    reportados: [...previo.reportados, ...salida.findings],
    hechas: previo.hechas + 1,
    cubiertos: previo.cubiertos + ficherosDe(parada),
    temas: esDeTema(parada) ? [...previo.temas, parada.modulo] : previo.temas,
    durationMs: previo.durationMs + salida.durationMs,
    usage: addUsage(previo.usage, salida.usage),
    tools: [...previo.tools, ...salida.tools],
    edits: [...previo.edits, ...salida.edits],
    texto: previo.texto + salida.texto
  }
}
