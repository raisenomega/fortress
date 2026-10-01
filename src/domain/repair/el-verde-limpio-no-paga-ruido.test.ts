import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { avisoDeHerencia, gateEnUnaLinea } from './aviso-de-herencia'
import { loQueElMotorSupo } from './lo-que-el-motor-supo'
import { describir } from '../../application/repair/motor-chain-outcome'
import type { ProposalEvent } from './proposal-event'

const VERDE_LIMPIO = [
  { toState: 'GATE', evidenceJson: JSON.stringify({ allCommandsGreen: true }) } as ProposalEvent
]

/** EL CASO NORMAL NO PAGA NADA: sin herencia, ni una palabra de mas. */
describe('un verde LIMPIO se presenta igual que siempre', () => {
  it('sin aviso, y la linea del revisor es la de antes', () => {
    expect(avisoDeHerencia(undefined)).toBeNull()
    expect(avisoDeHerencia([])).toBeNull()
    expect(loQueElMotorSupo(VERDE_LIMPIO)[1]).toBe('GATE: verde en todos los comandos')
  })

  it('y el parte tampoco mete ruido', () => {
    expect(describir({ kind: 'espera-omega', proposalId: 'p1234567' })).toBe(
      'p1234567: gate verde, esperando firma para juzgarla.'
    )
    expect(describir({ kind: 'espera-firma', proposalId: 'p1234567', condition: null })).toBe(
      'p1234567: aprobada, esperando firma humana.'
    )
  })

  it('un gate NO verde sigue diciendolo, con o sin herencia', () => {
    expect(gateEnUnaLinea(false, undefined)).toBe('NO verde')
    expect(gateEnUnaLinea(false, ['lint'])).toContain('NO verde')
  })
})

/** Los dos docblocks que mentian (DEUDAS §11.7): el tipo que define el
 *  veredicto describia un diseno anterior al que corre. */
describe('el tipo del veredicto ya no miente sobre la herencia', () => {
  const fuente = readFileSync('src/domain/repair/gate-result.ts', 'utf8')

  /**
   * Las dos frases viejas SIGUEN en el fichero, y a proposito: se citan para
   * dejar constancia de lo que decian. Lo que se exige es que no se afirmen —que
   * aparezcan SOLO entre comillas, detras de «El docblock decia»—.
   */
  it.each([
    ['hoy un verde no puede traer nada heredado', '**Un verde SI puede traerlos**'],
    ['No cambia el veredicto —rojo es rojo—', 'CONTRADECIA al codigo']
  ])('«%s» ya no se afirma: se cita y se corrige', (vieja, correccion) => {
    const citada = fuente.includes(`El docblock decia «${vieja}`)

    expect({ vieja, citada, corregida: fuente.includes(correccion) }).toEqual({
      vieja,
      citada: true,
      corregida: true
    })
  })
})
