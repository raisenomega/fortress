import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { loQueElMotorSupo } from './lo-que-el-motor-supo'
import { describir } from '../../application/repair/motor-chain-outcome'
import type { ProposalEvent } from './proposal-event'

const evento = (evidencia: object): ProposalEvent =>
  ({ toState: 'GATE', evidenceJson: JSON.stringify(evidencia) }) as ProposalEvent

const VERDE_CON_HERENCIA = [evento({ allCommandsGreen: true, heredado: ['test:unit'] })]

/**
 * DEUDAS §11.6 — el gate absolvia en silencio. Lo anoto doce veces en el libro
 * y nadie leyo el acta: ocho fixes llegaron a MERGEADO con los tests sin
 * verificar. Aqui se ata que la absolucion LLEGUE a los tres sitios donde se
 * decide: el revisor, la firma del operador y el parte.
 */
describe('un verde CON HERENCIA no se presenta como un verde limpio', () => {
  it('el revisor lo recibe: su linea del gate lo dice', () => {
    expect(loQueElMotorSupo(VERDE_CON_HERENCIA)[1]).toContain('CON HERENCIA')
    expect(loQueElMotorSupo(VERDE_CON_HERENCIA)[1]).toContain('NO verificado')
    expect(loQueElMotorSupo(VERDE_CON_HERENCIA)[1]).toContain('test:unit')
  })

  it('el parte lo dice, en los DOS desenlaces que salen de un gate verde', () => {
    const omega = describir({ kind: 'espera-omega', proposalId: 'p1234567', heredado: ['test:unit'] }) // prettier-ignore
    const firma = describir({ kind: 'espera-firma', proposalId: 'p1234567', condition: null, heredado: ['test:unit'] }) // prettier-ignore

    for (const linea of [omega, firma]) expect(linea).toContain('test:unit heredado')
  })

  /**
   * La razon del evento es la UNICA linea del gate que el operador lee en la
   * fila de Firma sin abrir nada. Se juzga el CODIGO que la escribe, en los dos
   * sitios: quien la compone y quien la asienta.
   */
  it('y la linea que el operador firma la lleva, no solo la evidencia', () => {
    const cierre = readFileSync('src/application/repair/cierre-del-gate.ts', 'utf8')
    const gate = readFileSync('src/application/repair/run-gate.ts', 'utf8')

    expect(cierre).toContain('avisoDeHerencia(outcome.heredado)')
    expect(/aviso === null \? 'gate verde' : `gate verde — \$\{aviso\}`/.test(cierre)).toBe(true)
    expect(/emitGateOutcome\([^)]*'GATE', razonDelVerde\(outcome\),/.test(gate)).toBe(true)
  })
})
