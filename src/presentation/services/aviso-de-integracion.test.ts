import { beforeEach, describe, expect, it } from 'vitest'
import type { Proposal } from '@domain/repair/proposal'
import { useToastStore } from '../stores/toast-store'
import { firmarPropuesta } from './firma-service'

/** Doble del puente: fuera de Electron no existe `window.api`. */
function stub(runOmega: () => Promise<unknown>, sign: () => Promise<unknown>): void {
  const cerco = (): Promise<unknown> =>
    Promise.resolve({ total: 0, trabajables: 0, autoIntegrables: 0, elegibles: 0 })
  // prettier-ignore
  Object.assign(globalThis, {
    window: { api: {
      repair: { runOmega, sign, cerco, list: () => Promise.resolve([]) },
      scan: { findings: () => Promise.resolve([]) }
    } }
  })
}

const enGate = { id: 'p-1', projectId: 'proj', state: 'GATE' } as Proposal
const enOmega = { id: 'p-1', projectId: 'proj', state: 'OMEGA' } as Proposal
const avisos = (): string[] => useToastStore.getState().toasts.map((t) => t.message)

describe('el operador se entera SIEMPRE de que el repo cambio', () => {
  beforeEach(() => useToastStore.setState({ toasts: [] }))

  it('firmar en GATE que ademas integra: lo dice', async () => {
    // Antes el aviso se decidia mirando el estado ANTERIOR de la propuesta, asi
    // que una integracion nacida en GATE ocurria en silencio.
    stub(() => Promise.resolve({ ok: true, verdict: {}, integrada: true }), () => Promise.resolve({})) // prettier-ignore
    await firmarPropuesta(enGate)

    expect(avisos().join(' ')).toContain('Integrada')
  })

  it('firmar en GATE que solo juzga: no anuncia un cambio que no hubo', async () => {
    stub(() => Promise.resolve({ ok: true, verdict: {}, integrada: false }), () => Promise.resolve({})) // prettier-ignore
    await firmarPropuesta(enGate)

    expect(avisos().join(' ')).not.toContain('Integrada')
  })

  it('firmar en OMEGA que integra: lo dice, como siempre', async () => {
    stub(() => Promise.resolve({}), () => Promise.resolve({ applied: true })) // prettier-ignore
    await firmarPropuesta(enOmega)

    expect(avisos().join(' ')).toContain('Integrada')
  })

  it('firmar en OMEGA que no integra: el motivo, y ningun anuncio falso', async () => {
    stub(() => Promise.resolve({}), () => Promise.resolve({ applied: false, reason: 'carril-ocupado' })) // prettier-ignore
    await firmarPropuesta(enOmega)

    expect(avisos().join(' ')).toContain('carril-ocupado')
    expect(avisos().join(' ')).not.toContain('Integrada')
  })
})
