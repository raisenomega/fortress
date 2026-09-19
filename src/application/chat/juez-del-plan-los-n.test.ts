import { describe, expect, it } from 'vitest'
import { juezSobre, LINEAS, LOTE } from './juez-del-plan-fixture'

/**
 * ADR-097 ENMIENDA 1 (§2.2-bis). Un plan de lote cubre N hallazgos, y lo que el
 * productor propone es en que ORDEN y con que enfoque atacarlos. Estos tests son
 * los que el paso 2 NO tenia: se escribio para uno, y con uno solo juzgar contra
 * el primero y juzgar contra los N dan el mismo resultado — por eso el ensayo
 * del 18-sep, que fue de 1 hallazgo, no destapo el hueco.
 */
describe('el plan de N se juzga contra los N', () => {
  it('los TRES hallazgos van en el prompt, no solo el primero', async () => {
    const { juez, prompts } = juezSobre()

    await juez(LOTE, 'primero las llaves, luego el sink')

    for (const linea of LINEAS) expect(prompts[0]).toContain(linea)
  })

  it('y le pide juzgar el CONJUNTO: no hallazgo por hallazgo', async () => {
    const { juez, prompts } = juezSobre()

    await juez(LOTE, 'un plan')

    expect(prompts[0]).toContain('EL CONJUNTO')
    expect(prompts[0]).toContain('total="3"')
  })

  it('UNA corrida para los tres, no una por hallazgo', async () => {
    // Un plan es UNA direccion. Juzgarlo N veces seria pagar N juicios para
    // contestar una sola pregunta, y ademas contestarla mal.
    const { juez, prompts } = juezSobre()

    await juez(LOTE, 'un plan')

    expect(prompts).toHaveLength(1)
  })
})
