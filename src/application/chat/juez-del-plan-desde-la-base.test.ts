import { describe, expect, it } from 'vitest'
import { juezSobre, LOTE, memoria } from './juez-del-plan-fixture'

/**
 * ADR-097 §2.2-bis: el juez recibe los IDS y relee los hallazgos de la base. Del
 * mensaje solo se aceptan los ids, como con el foco: una lista que le llegara
 * hecha seria una lista que quien llama pudo componer.
 *
 * Aparte de `juez-del-plan-los-n.test.ts` porque son dos preguntas —cuantos se
 * juzgan y de donde salen— y juntas pasaban de 75 lineas.
 */
describe('los hallazgos salen de la BASE, no del mensaje', () => {
  it('un id que el mensaje trae pero la base da por mitigado NO entra', async () => {
    const viva = [memoria('f1'), memoria('f2'), memoria('f3', { lifecycle: 'MITIGATED' })]
    const { juez, prompts } = juezSobre(viva)

    await juez(LOTE, 'un plan')

    expect(prompts[0]).toContain('t-f2')
    expect(prompts[0]).not.toContain('t-f3')
    expect(prompts[0]).toContain('total="2"')
  })

  it('si no queda NINGUNO vivo: null, y ni siquiera se gasta la corrida', async () => {
    // Si no hay nada que juzgar tampoco hay nada que aprobar. Devolver null es
    // lo que deja la puerta del §4 cerrada; inventar un ADELANTE sobre una lista
    // vacia la abriria de par en par.
    const { juez, prompts } = juezSobre([])

    expect(await juez(LOTE, 'un plan')).toBeNull()
    expect(prompts).toHaveLength(0)
  })
})
