import type { OmegaEntry } from './omega-entry'

/** Resumen global del Libro de la Vida para la cabecera. Todo contado, nada inventado. */
export interface OmegaOverview {
  readonly records: number
  readonly oks: number
  readonly discrepancies: number
  readonly vetos: number
  readonly infos: number
  /** % de verificaciones que cuadran, o null si no hay ninguna con veredicto duro. */
  readonly integrity: number | null
  readonly lastAt: string | null
}

const count = (log: readonly OmegaEntry[], verdict: string): number =>
  log.filter((entry) => entry.verdict === verdict).length

export function overview(log: readonly OmegaEntry[]): OmegaOverview {
  const oks = count(log, 'ok')
  const discrepancies = count(log, 'discrepancia')
  const vetos = count(log, 'veto')
  const duros = oks + discrepancies + vetos

  return {
    records: log.length,
    oks,
    discrepancies,
    vetos,
    infos: count(log, 'info'),
    integrity: duros === 0 ? null : Math.round((100 * oks) / duros),
    lastAt: log[0]?.at ?? null
  }
}
