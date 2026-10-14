import { afterEach, describe, expect, it, vi } from 'vitest'
import { CTX, ctxConFicheros, deps, espera, motor } from './drenar-fixture'
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

  it('sin ficheros compartidos la corrida no anota colisiones', async () => {
    motor(espera('a'), espera('b'))
    const ctx = ctxConFicheros({ a: ['src/x.ts'], b: ['src/y.ts'] })
    expect((await drenarHastaOmega(ctx, 'p1', deps())).colisiones).toEqual([])
  })
})

describe('la senal de colision: el drenaje deja de ser mudo (GAP A)', () => {
  it('dos que aterrizan espera-firma sobre el mismo fichero se anotan', async () => {
    motor(espera('a'), espera('b'))
    const ctx = ctxConFicheros({ a: ['src/x.ts'], b: ['src/x.ts', 'src/y.ts'] })
    const r = await drenarHastaOmega(ctx, 'p1', deps())
    expect(r.colisiones).toEqual([{ proposalId: 'b', ficheros: ['src/x.ts'], yaTocadosPor: ['a'] }])
    // SENAL, NO BLOQUEO: la colision no cambia el destino — ambas siguen contadas
    // como esperando firma. Si revertir el cableado deja esto en [], el test cae.
    expect(r.acumuladas).toBe(2)
  })
})
