import { describe, expect, it } from 'vitest'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { toOmegaOutcome } from './omega-outcome'

const META = (): AnalystRunMeta => ({ tokensUsed: 0, durationMs: 0, startedAt: 0, endedAt: 0 })
const EJES =
  '"resuelve_el_hallazgo":"SI","respeta_scope":"SI","respeta_doNotTouch":"SI",' +
  '"calidad_del_diff":"BUENO","riesgo_residual":"NINGUNO","veredicto_global":"APROBADO",' +
  '"razon":"cierra el agujero"'

const verdict = (extra = ''): string => `VERDICT:{${EJES}${extra}}:END-VERDICT`

describe('OMEGA: el veredicto y la nota tienen DUREZAS distintas', () => {
  it('una nota buena viaja con el veredicto', () => {
    const out = toOmegaOutcome(
      verdict(',"notes":[{"kind":"gap","area":"worktree","note":"no pude leer el diff base"}]'),
      META
    )

    expect(out.ok).toBe(true)
    expect(out.ok && out.notas).toEqual([
      { kind: 'gap', area: 'worktree', note: 'no pude leer el diff base' }
    ])
  })

  it('una nota MAL FORMADA no tumba el veredicto: se descarta sola', () => {
    // El cuidado del inventario: `parseOmegaResponse` invalida TODO si un campo
    // no cuadra —«no se inventan ejes»—. Si la nota fuera por esa puerta, un
    // apunte al margen tiraria un juicio correcto. Va por `toSelfNotes`, que es
    // tolerante, y por eso el veredicto sobrevive.
    const out = toOmegaOutcome(verdict(',"notes":[{"kind":"inventado","area":7}]'), META)

    expect(out.ok).toBe(true)
    expect(out.ok && out.verdict.veredicto_global).toBe('APROBADO')
    expect(out.ok && out.notas).toEqual([])
  })

  it('y `notes` con basura entera tampoco: ni array siquiera', () => {
    const out = toOmegaOutcome(verdict(',"notes":"esto deberia ser una lista"'), META)

    expect(out.ok).toBe(true)
    expect(out.ok && out.notas).toEqual([])
  })

  it('sin notas, el veredicto se lee como siempre', () => {
    const out = toOmegaOutcome(verdict(), META)

    expect(out.ok && out.verdict.razon).toBe('cierra el agujero')
    expect(out.ok && out.notas).toEqual([])
  })

  it('un VERDICT roto SIGUE siendo un fallo: la tolerancia es solo de la nota', () => {
    const out = toOmegaOutcome('VERDICT:{"resuelve_el_hallazgo":"QUIZA"}:END-VERDICT', META)

    expect(out.ok).toBe(false)
  })
})
