import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NO_ES_SU_VEHICULO, VA_POR_EL_TERMINAL } from '@domain/repair/vehiculo-del-motor'
import { CTX, deps, motor } from './drenar-fixture'
import { ctx, DEPS, elige, niega } from './run-motor-chain-fixture'
import { describir } from './motor-chain-outcome'
import { drenarHastaOmega } from './drenar-hasta-omega'
import { runMotorChain } from './run-motor-chain'

/**
 * El motivo del plan tiene que LLEGAR. Antes moria en el `null` de `planRepair`:
 * un proyecto negado por el perimetro (ADR-107) se contaba igual que un pozo
 * agotado, y el operador leia «no queda nada elegible» sobre un bloqueo
 * deliberado. Aqui se prueba el camino entero, eslabon por eslabon.
 */
describe('el motivo de la negativa llega de punta a punta (ADR-107)', () => {
  beforeEach(() => void vi.restoreAllMocks())
  afterEach(() => void vi.restoreAllMocks())

  it('la cadena distingue el bloqueo del perimetro de un pozo agotado', async () => {
    niega(NO_ES_SU_VEHICULO)
    expect(await runMotorChain(ctx(), 'proj', DEPS)).toMatchObject({ value: { kind: 'negado' } })
  })

  it('y sigue contando como sin-candidato lo que siempre lo fue', async () => {
    elige(null)
    expect(await runMotorChain(ctx(), 'proj', DEPS)).toMatchObject({ value: { kind: 'sin-candidato' } }) // prettier-ignore
  })

  it('el drenaje no lo confunde con haber agotado el pozo', async () => {
    motor({ kind: 'negado' })
    expect((await drenarHastaOmega(CTX, 'p1', deps())).fin).toBe('negado')
  })

  /**
   * La leccion escrita en `describir`: un `kind` nuevo que nadie nombra se cae
   * al `return` final y se anuncia como INTEGRADA. Es la peor linea posible.
   */
  it('y se cuenta con su nombre, no como integrada', () => {
    expect(describir({ kind: 'negado' })).toBe(VA_POR_EL_TERMINAL)
    expect(describir({ kind: 'negado' })).toContain('Terminal')
  })
})
