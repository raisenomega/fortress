import { describe, expect, it } from 'vitest'
import { turno } from './turno-con-foco-fixture'

const NEUTRO = 'Resuelve este hallazgo'

describe('el Terminal recibe UN hallazgo por id (ADR-088, pieza 2)', () => {
  it('el findingId viaja hasta el prompt: ESE hallazgo, y no la lista', async () => {
    const { r, pedidos } = await turno({ prompt: NEUTRO, findingId: 'f-neutro' })

    expect(r.ok).toBe(true)
    expect(pedidos).toHaveLength(1)
    expect(pedidos[0].prompt).toContain('Hallazgo a resolver')
    expect(pedidos[0].prompt).toContain('- id: f-neutro')
    expect(pedidos[0].prompt).toContain('- fichero: src/util/formato.ts:12')
    expect(pedidos[0].prompt).not.toContain('Hallazgos ya registrados')
  })
})

describe('la degradacion se preserva: un prompt neutro no esconde el hallazgo', () => {
  it('un hallazgo en fichero sensible degrada a plan aunque el prompt sea neutro', async () => {
    // «Resuelve este hallazgo» no nombra ningun area protegida; `src/auth/…` si.
    // Si solo se juzgara el prompt, este turno editaria auth sin supervision.
    const { pedidos } = await turno({ prompt: NEUTRO, findingId: 'f-auth' })

    expect(pedidos[0].permissionMode).toBe('plan')
  })

  it('control: el mismo prompt neutro con un hallazgo neutro SI edita', async () => {
    const { pedidos } = await turno({ prompt: NEUTRO, findingId: 'f-neutro' })

    expect(pedidos[0].permissionMode).toBe('acceptEdits')
  })
})

describe('con foco no hay workflow: resolver un hallazgo es UN turno', () => {
  const ORDEN = 'arregla el error de seguridad'

  it('«arregla el error de seguridad» con findingId es un solo turno', async () => {
    const { pedidos } = await turno({ prompt: ORDEN, findingId: 'f-neutro' })

    expect(pedidos).toHaveLength(1)
  })

  it('control: sin findingId, la misma orden dispara el workflow entero', async () => {
    const { pedidos } = await turno({ prompt: ORDEN })

    expect(pedidos.length).toBeGreaterThan(1)
  })
})

describe('del renderer solo vale el id: la base decide', () => {
  it.each([
    ['que no es de este proyecto', 'f-de-otro'],
    ['que ya no esta vivo', 'f-mitigado']
  ])('un foco %s no gasta: error, sin agente y sin nada guardado', async (_caso, findingId) => {
    const { r, pedidos, added } = await turno({ prompt: NEUTRO, findingId })

    expect(r.ok).toBe(false)
    expect(pedidos).toHaveLength(0)
    expect(added).toHaveLength(0)
  })
})
