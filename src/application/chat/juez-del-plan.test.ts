import { describe, expect, it } from 'vitest'
import { juezSobre, LOTE } from './juez-del-plan-fixture'

/**
 * ADR-097 §2. El juez del plan de punta a punta: prompt propio y bloque propio.
 * Recibe los IDS del lote y relee los hallazgos (§2.2-bis); los N tienen su
 * fichero, de donde salen el suyo, y lo que pasa cuando OMEGA no juzga el suyo.
 */
describe('el juez del plan', () => {
  it('lee el bloque PLAN y devuelve el juicio', async () => {
    const { juez } = juezSobre()

    expect(await juez(LOTE, 'borro el sink')).toMatchObject({ veredicto: 'ADELANTE' })
  })

  it('el prompt lleva el PLAN del productor', async () => {
    const { juez, prompts } = juezSobre()

    await juez(LOTE, 'borro el sink de report.html')

    expect(prompts[0]).toContain('borro el sink de report.html')
  })

  it('le dice a OMEGA que juzga una PROMESA, no un hecho', async () => {
    // La honestidad del §2.3 va DENTRO del prompt: sin eso OMEGA juzgaria como
    // si tuviera un diff y devolveria una certeza que no tiene.
    const { juez, prompts } = juezSobre()

    await juez(LOTE, 'un plan')

    expect(prompts[0]).toContain('UNA PROMESA, NO UN HECHO')
    expect(prompts[0]).toContain('NO_SE_PUEDE_SABER')
  })
})
