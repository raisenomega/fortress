import { describe, expect, it } from 'vitest'
import { hasBlockingRejection } from '@domain/repair/bloqueo-por-rechazo'
import type { Proposal } from '@domain/repair/proposal'
import { APROBADO, bench } from './run-omega-fixture'
import { runOmega } from './run-omega'

/**
 * ADR-115 B1. Cuando OMEGA dice que el arreglo NO resuelve el hallazgo, repetir
 * no cambia nada: hace falta otro arbol o una decision. El eje solo vivia en la
 * evidencia, y el freno solo ve la propuesta, asi que el veto se escribia como
 * `omega_vetado` y se reintentaba (6 veces en la historia, entre ellas el primer
 * intento de electron-builder). Ahora el motivo lo dice, y el freno lo pausa.
 */
const META = { tokensUsed: 120_000, durationMs: 1, startedAt: 1, endedAt: 2 }
const juzgar = async (eje: Record<string, string>): Promise<string> => {
  const b = bench({ result: { ok: true, verdict: { ...APROBADO, ...eje, veredicto_global: 'VETADO' }, runMeta: META, notas: [] } }) // prettier-ignore
  await runOmega(b.context, 'prop-1', b.deps)
  return b.patches.at(-1)?.analysisReason ?? ''
}
const enElFreno = (analysisReason: string): boolean =>
  hasBlockingRejection('f1', 'h', [{ id: 'p', projectId: 'x', findingId: 'f1', baseSha: 'h', state: 'RECHAZADO', analysisReason, createdAt: 1, updatedAt: 1 } as Proposal], 'c') // prettier-ignore

describe('un veto porque el arreglo NO resuelve pausa desde el primer rechazo', () => {
  it('el motivo escrito lo dice', async () => {
    expect(await juzgar({ resuelve_el_hallazgo: 'NO' })).toMatch(/^omega_no_resuelve: /)
  })

  it('y el freno lo pausa ya en el primero', async () => {
    expect(enElFreno(await juzgar({ resuelve_el_hallazgo: 'NO' }))).toBe(true)
  })

  it('un veto por otro eje (riesgo MAYOR) sigue siendo omega_vetado, con su segundo intento', async () => {
    const motivo = await juzgar({ resuelve_el_hallazgo: 'PARCIAL', riesgo_residual: 'MAYOR' })
    expect(motivo).toMatch(/^omega_vetado: /)
    expect(enElFreno(motivo)).toBe(false)
  })
})
