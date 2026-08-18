import { parseAmount, parseCount } from './loop-budget-fields'

/**
 * Lo que acota una sesion de loop, en dos categorias que NO se comportan igual.
 *
 * FRENOS DUROS de gasto (costCapUsd, maxCycles): sin valores por defecto. El
 * operador los fija a mano en Configuracion y hasta que AMBOS esten guardados y
 * sean > 0 el loop no se puede encender (loopConfigured). Nadie decide por el
 * cuanto esta dispuesto a gastar.
 *
 * VALVULAS de comportamiento (las cuatro restantes): con default razonable.
 * Ajustan como se comporta el ciclo, no cuanto gasta, y el sistema sabe
 * contestarlas solo: exigirlas bloquearia el loop por nada.
 */
export interface LoopBudget {
  /** Tope de gasto acumulado de la sesion de loop, en dolares. */
  readonly costCapUsd: number
  /** Maximo de propuestas cerradas por sesion de loop. */
  readonly maxCycles: number
  /** Denegaciones seguidas de la politica que se toleran antes de parar. */
  readonly maxConsecutiveDenials: number
  /**
   * Integraciones que se acumulan antes de volver a escanear. Cero significa
   * escanear en cada vuelta: es el valor que reproduce el comportamiento de
   * antes de que la cadencia existiera, no una forma de apagarla.
   */
  readonly rescanEvery: number
  /** Vueltas seguidas en vacio que se toleran antes de dar la baraja por agotada. */
  readonly maxConsecutiveNoCandidates: number
  /** Fixes seguidos descartados que se toleran antes de admitir que no se avanza. */
  readonly maxConsecutiveDiscarded: number
}

/** Denegaciones seguidas que se toleran cuando el operador no dice otra cosa. */
export const DEFAULT_MAX_DENIALS = 5

/** Integraciones entre escaneos cuando el operador no dice otra cosa. */
export const DEFAULT_RESCAN_EVERY = 3

/**
 * Vueltas en vacio que se toleran. Mas alto que el de denegaciones porque dicen
 * cosas distintas: una denegacion es la politica frenando trabajo que existe;
 * una vuelta sin candidato es no haber trabajo, cosa benigna que ademas puede
 * deshacerse sola en cuanto el proximo escaneo traiga hallazgos.
 */
export const DEFAULT_MAX_NO_CANDIDATES = 10

/** Fixes descartados seguidos que se toleran. Bajo a proposito: cada uno costo
 *  un analisis y una generacion, y tres bastaban para ver el patron en los
 *  ejercicios del 17 y 18 de agosto (catorce y seis, todas por lo mismo). */
export const DEFAULT_MAX_DISCARDED = 3

/** Lee los topes de settings. Los frenos duros sin fijar -> 0 (loop no listo). */
export function parseLoopBudget(
  costCap: string | null,
  maxCycles: string | null,
  maxDenials: string | null,
  rescanEvery: string | null,
  maxNoCandidates: string | null,
  maxDiscarded: string | null
): LoopBudget {
  return {
    costCapUsd: parseAmount(costCap),
    maxCycles: parseCount(maxCycles) ?? 0,
    maxConsecutiveDenials: parseCount(maxDenials) ?? DEFAULT_MAX_DENIALS,
    rescanEvery: parseCount(rescanEvery) ?? DEFAULT_RESCAN_EVERY,
    maxConsecutiveNoCandidates: parseCount(maxNoCandidates) ?? DEFAULT_MAX_NO_CANDIDATES,
    maxConsecutiveDiscarded: parseCount(maxDiscarded) ?? DEFAULT_MAX_DISCARDED
  }
}

/** El loop solo se habilita si los dos FRENOS DUROS estan fijados y son positivos. */
export function loopConfigured(budget: LoopBudget): boolean {
  return budget.costCapUsd > 0 && budget.maxCycles > 0
}
