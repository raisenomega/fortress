import { describe, expect, it } from 'vitest'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'
import { cerrarLaCadena } from './cierre-de-la-cadena'
import type { DesenlaceDelLazo } from './desenlace-del-lazo'
import type { JudgeDeps } from './judge-and-integrate'
import { PARCIAL } from './veredictos-fixture'

/**
 * DEUDAS §15.2 — el recibo del lazo. Cuando el lazo decide NO dar la vuelta,
 * `cerrarLaCadena` ignoraba `parada`: una parada legitima y un fallo se veian
 * igual —nada—. La leccion de ADR-109 (lo no verificado se DECLARA donde se
 * lee) aplicada al propio lazo: el mecanismo para igual, deja de ser silencioso.
 */
const libro = (): { eventos: ProposalEvent[]; ctx: AppContext } => {
  const eventos: ProposalEvent[] = [{ id: 'e1', proposalId: 'p-1', seq: 7, phase: 'GENERATE', eventType: 'DECISION', actor: 'motor', ts: 1 }] // prettier-ignore
  const ctx = {
    eventLog: { list: () => Promise.resolve(eventos), record: (e: ProposalEvent) => (eventos.push(e), Promise.resolve()) }, // prettier-ignore
    repairProposals: { findById: () => ({ state: 'OMEGA' }) }
  } as unknown as AppContext
  return { eventos, ctx }
}

const lazoCon = (parada: DesenlaceDelLazo['parada'], vueltas = 0): DesenlaceDelLazo =>
  ({ juicio: { omega: { ok: true, verdict: PARCIAL }, merge: null }, vueltas, sesion: 's', parada }) as never // prettier-ignore

const cerrar = (ctx: AppContext, lazo: DesenlaceDelLazo): ReturnType<typeof cerrarLaCadena> =>
  cerrarLaCadena(ctx, 'p-1', {} as JudgeDeps, lazo, 'hasta-omega', undefined)

const recibos = (eventos: readonly ProposalEvent[]): readonly ProposalEvent[] =>
  eventos.filter((e) => e.reason === 'PARADA_DEL_LAZO')

describe('el recibo del lazo (DEUDAS §15.2)', () => {
  it.each(['sin-sesion', 'sin-huella', 'convergio', 'tope-de-vueltas', 'tope-de-dolares'] as const)(
    'la parada %s deja su recibo en el libro, con el motivo dentro',
    async (parada) => {
      const { eventos, ctx } = libro()
      await cerrar(ctx, lazoCon(parada, 1))
      const [r] = recibos(eventos)
      expect(r).toBeDefined()
      expect(JSON.parse(r?.evidenceJson ?? '{}')).toEqual({ parada, vueltas: 1 })
      // DECISION del motor en la fase donde se decide (tras OMEGA), seq monotonico.
      expect([r?.eventType, r?.actor, r?.phase, r?.seq]).toEqual(['DECISION', 'motor', 'OMEGA', 8])
    }
  )

  it('COMPLETO no deja recibo: el lazo no evaluo nada y gen=1 ya se lee', async () => {
    const { eventos, ctx } = libro()
    await cerrar(ctx, lazoCon('completo'))
    expect(recibos(eventos)).toEqual([])
  })

  it('paso-fallido tampoco: el paso que corto ya asento el suyo', async () => {
    const { eventos, ctx } = libro()
    await cerrar(ctx, { ...lazoCon('convergio'), parada: 'paso-fallido', cortado: 'gate rojo' })
    expect(recibos(eventos)).toEqual([])
  })

  it('cuando SI dispara y luego para, el recibo cuenta las vueltas dadas', async () => {
    const { eventos, ctx } = libro()
    await cerrar(ctx, lazoCon('tope-de-vueltas', 2))
    expect(JSON.parse(recibos(eventos)[0]?.evidenceJson ?? '{}')).toEqual({ parada: 'tope-de-vueltas', vueltas: 2 }) // prettier-ignore
  })
})
