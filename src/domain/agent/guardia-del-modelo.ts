import type { Peldano } from './escalera-de-modelos'

export interface JuicioDelModelo {
  readonly veredicto: 'ok' | 'aviso' | 'falla'
  /** El modelo PRINCIPAL que corrio, o null si el CLI no lo dijo. */
  readonly modelo: string | null
  readonly motivo?: string
}

const TIER: Record<string, number> = { haiku: 1, sonnet: 2, opus: 3 }
const FORMA = /claude-(opus|sonnet|haiku|fable)-(\d+)(?:-(\d{1,3}))?(?!\d)/

/** Familia y version (`claude-opus-4-8` → opus, 4.8). Una fecha no es version. */
function leer(id: string): { familia: string; version: number } | null {
  const m = FORMA.exec(id)
  return m === null ? null : { familia: m[1], version: Number(m[2]) + Number(m[3] ?? 0) / 100 }
}

/**
 * El guardian del modelo que DE VERDAD corrio (ADR-078, enmienda 2026-10-05).
 * `usados` con el principal primero. Tres reglas, en este orden:
 * - Fable en cualquier puesto → FALLA (Covered Model: 30 dias de retencion).
 * - El principal por debajo del pedido (opus pedido, sonnet servido) → FALLA.
 * - Dos de la misma familia con versiones distintas (el fallback de Opus 5 a
 *   4.8) → AVISO: se registra y se sigue, nunca mata al Motor.
 */
export function juzgarModelo(pedido: Peldano, usados: readonly string[]): JuicioDelModelo {
  if (usados.length === 0) return { veredicto: 'ok', modelo: null }
  const principal = usados[0]
  const fable = usados.find((u) => u.includes('fable'))
  if (fable !== undefined) return { veredicto: 'falla', modelo: principal, motivo: `${fable}: Fable prohibido por doctrina` } // prettier-ignore
  const p = leer(principal)
  if (p !== null && (TIER[p.familia] ?? 0) < (TIER[pedido] ?? 0)) {
    return { veredicto: 'falla', modelo: principal, motivo: `${principal} por debajo de ${pedido}` }
  }
  const viejo = usados.find((u) => {
    const v = leer(u)
    return v !== null && p !== null && v.familia === p.familia && v.version < p.version
  })
  if (viejo !== undefined) return { veredicto: 'aviso', modelo: principal, motivo: `${viejo} mas viejo que ${principal}` } // prettier-ignore
  return { veredicto: 'ok', modelo: principal }
}
