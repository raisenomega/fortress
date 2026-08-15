/**
 * Lo que acota una sesion de loop, en dos categorias que NO se comportan igual.
 *
 * FRENOS DUROS de gasto (costCapUsd, maxCycles): sin valores por defecto. El
 * operador los fija a mano en Configuracion y hasta que AMBOS esten guardados y
 * sean > 0 el loop no se puede encender (loopConfigured). Nadie decide por el
 * cuanto esta dispuesto a gastar.
 *
 * VALVULAS de comportamiento (maxConsecutiveDenials): con default razonable. No
 * limitan gasto: detienen el loop cuando un patron dice que la politica y la
 * baraja no encajan. Sin configurar hay una respuesta sensata, asi que exigirlas
 * bloquearia el loop por una pregunta que el sistema sabe contestar solo.
 */
export interface LoopBudget {
  /** Tope de gasto acumulado de la sesion de loop, en dolares. */
  readonly costCapUsd: number
  /** Maximo de propuestas cerradas por sesion de loop. */
  readonly maxCycles: number
  /** Denegaciones seguidas de la politica que se toleran antes de parar. */
  readonly maxConsecutiveDenials: number
}

/** Denegaciones seguidas que se toleran cuando el operador no dice otra cosa. */
export const DEFAULT_MAX_DENIALS = 5

function parseAmount(raw: string | null): number {
  if (raw === null) return 0
  const value = Number.parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(value, 1000)
}

/**
 * null cuando no hay nada guardado o lo guardado no sirve; el numero cuando si.
 * Devolver 0 para el ausente aplanaria dos hechos distintos —"no configurado" y
 * "el operador escribio 0"— en el mismo valor, y quien tiene un default que
 * aplicar necesita justamente esa diferencia.
 */
function parseCount(raw: string | null): number | null {
  if (raw === null) return null
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.min(value, 100)
}

/** Lee los topes de settings. Los frenos duros sin fijar -> 0 (loop no listo). */
export function parseLoopBudget(
  costCap: string | null,
  maxCycles: string | null,
  maxDenials: string | null
): LoopBudget {
  return {
    costCapUsd: parseAmount(costCap),
    maxCycles: parseCount(maxCycles) ?? 0,
    maxConsecutiveDenials: parseCount(maxDenials) ?? DEFAULT_MAX_DENIALS
  }
}

/** El loop solo se habilita si los dos FRENOS DUROS estan fijados y son positivos. */
export function loopConfigured(budget: LoopBudget): boolean {
  return budget.costCapUsd > 0 && budget.maxCycles > 0
}
