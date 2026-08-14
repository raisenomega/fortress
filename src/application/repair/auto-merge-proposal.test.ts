import { describe, expect, it } from 'vitest'
import { autoMergeProposal } from './auto-merge-proposal'
import { banco, POLICY_ON, type Opciones } from './auto-merge-fixture'
import { cadenaSin } from './collect-post-omega-fixture'

interface Salida {
  readonly applied: boolean
  readonly reason?: string
  readonly asientos: number
  readonly resumen?: string
}

async function correr(opts: Opciones = {}): Promise<Salida> {
  const b = banco(opts)
  const r = await autoMergeProposal(b.context, b.deps, { proposalId: 'p-1' })
  return { ...r, asientos: b.entries.length, resumen: b.entries[0]?.summary }
}

const conPolitica = (over: Partial<typeof POLICY_ON>): Opciones => ({
  config: { kind: 'valid', policy: { ...POLICY_ON, ...over } }
})

describe('autoMergeProposal: sin expediente no hay decision que asentar', () => {
  it('propuesta inexistente: ni integra ni escribe en el libro', async () => {
    expect(await correr({ propuesta: false })).toMatchObject({ reason: 'proposal-not-found', asientos: 0 }) // prettier-ignore
  })

  it('proyecto ausente de la base: no se sabe donde mergear', async () => {
    expect(await correr({ proyecto: false })).toMatchObject({ reason: 'project-not-found', asientos: 0 }) // prettier-ignore
  })

  it('libro sin veredicto: no hay estado post-OMEGA que juzgar', async () => {
    const r = await correr({ events: cadenaSin('OMEGA', 'TRANSITION') })
    expect(r).toMatchObject({ applied: false, reason: 'incomplete-state', asientos: 0 })
  })

  it('hallazgo fuera de memoria: sin severidad no se inventa una', async () => {
    expect(await correr({ hallazgo: false })).toMatchObject({ reason: 'unknown-severity', asientos: 0 }) // prettier-ignore
  })
})

describe('autoMergeProposal: la politica decide y el libro lo registra', () => {
  it('sin .fortress/config hereda el default, que nace apagado', async () => {
    const r = await correr({ config: { kind: 'not-present' } })
    expect(r).toMatchObject({ applied: false, reason: 'not-configured', asientos: 1 })
    expect(r.resumen).toContain('no esta activada')
  })

  it('config ilegible: la politica no se llego a evaluar y se dice asi', async () => {
    const r = await correr({ config: { kind: 'invalid', reason: 'no es JSON valido' } })
    expect(r).toMatchObject({ applied: false, reason: 'config-invalid', asientos: 1 })
    expect(r.resumen).toContain('configuracion ilegible — no es JSON valido')
  })

  it('interruptor apagado a proposito: distinto de no haber configurado', async () => {
    const r = await correr(conPolitica({ enabled: false }))
    expect(r).toMatchObject({ applied: false, reason: 'policy-blocked-disabled', asientos: 1 })
  })

  it('severidad fuera de la lista: exige firma humana', async () => {
    const r = await correr({ severity: 'HIGH' })
    expect(r).toMatchObject({ applied: false, reason: 'policy-blocked-severity', asientos: 1 })
  })

  it('archivo excluido: la lista corta aunque lo demas cuadre', async () => {
    const r = await correr(conPolitica({ blacklist: ['src/**'] }))
    expect(r).toMatchObject({ applied: false, reason: 'policy-blocked-blacklist', asientos: 1 })
  })
})
