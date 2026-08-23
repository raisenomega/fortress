import { afterEach, describe, expect, it, vi } from 'vitest'
import { CTX, deps, espera, motor } from './drenar-fixture'
import { drenarHastaOmega } from './drenar-hasta-omega'

afterEach(() => vi.restoreAllMocks())

describe('el drenaje recorre los elegibles y los deja esperando firma', () => {
  it('acumula los aprobados y para cuando no queda nadie', async () => {
    motor(espera('a'), espera('b'), espera('c'))
    expect(await drenarHastaOmega(CTX, 'p1', deps())).toMatchObject({
      fin: 'sin-candidato',
      acumuladas: 3
    })
  })

  it('siempre pide el modo hasta-omega: nunca integra', async () => {
    const espia = motor(espera('a'))
    await drenarHastaOmega(CTX, 'p1', deps())
    expect(espia.mock.calls[0]?.[3]).toBe('hasta-omega')
  })

  it('lo que OMEGA veta no cuenta como esperando firma', async () => {
    // Un veto cierra en RECHAZADO y sale como descartada: no esta en la cola.
    motor({ kind: 'descartada', proposalId: 'a', motivo: 'omega_vetado' }, espera('b'))
    expect((await drenarHastaOmega(CTX, 'p1', deps())).acumuladas).toBe(1)
  })
})
