import { describe, expect, it } from 'vitest'
import { MOTIVO_HUELLA } from '@domain/repair/motivo-de-la-huella'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

const delaHuella = (b: ReturnType<typeof bench>): readonly unknown[] =>
  b.events.filter((e) => e.reason === MOTIVO_HUELLA).map((e) => JSON.parse(e.evidenceJson ?? '{}'))

describe('la huella del trabajo del generador se asienta en el libro', () => {
  it('en el camino feliz, ANTES de que el commit vacie el diff', async () => {
    const b = bench({})
    await generateFix(b.context, 'prop-1', b.deps)

    expect(delaHuella(b)).toHaveLength(1)
  })

  /**
   * Es EL caso que hay que poder autopsiar: los 20 `turnos_agotados` medidos
   * aterrizan aqui, con el worktree conservado y sus ediciones en disco. Si la
   * huella solo se asentara en el camino feliz, la pregunta que motivo toda la
   * pieza —«a las 30 vueltas, avanzaba o giraba?»— seguiria sin respuesta.
   */
  it('y TAMBIEN cuando el generador agota sus vueltas', async () => {
    const b = bench({ turnosAgotados: true })
    await generateFix(b.context, 'prop-1', b.deps)

    expect(delaHuella(b)).toHaveLength(1)
  })

  it('lleva la huella, las vueltas declaradas y el gasto', async () => {
    const b = bench({ turnosAgotados: true, turnos: 31, genCost: 265_000 })
    await generateFix(b.context, 'prop-1', b.deps)

    expect(delaHuella(b)[0]).toEqual({ huella: 'h'.repeat(40), turnos: 31, gasto: 265_000 })
  })

  it('no asienta el TEXTO del diff: solo su huella', async () => {
    const b = bench({})
    await generateFix(b.context, 'prop-1', b.deps)
    const crudo = JSON.stringify(delaHuella(b))

    expect(crudo).not.toContain('diff --git')
    expect(crudo.length).toBeLessThan(200)
  })
})
