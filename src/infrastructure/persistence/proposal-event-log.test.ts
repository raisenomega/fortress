import { describe, expect, it } from 'vitest'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalEventRepository } from '@domain/repair/proposal-event-repository'
import { createProposalEventLog } from './proposal-event-log'

const EVENTO = { id: 'e1', proposalId: 'p-1', seq: 1, phase: 'GATE', eventType: 'TRANSITION', actor: 'motor', ts: 1 } as ProposalEvent // prettier-ignore

function repo(): { puerto: ProposalEventRepository; asentados: ProposalEvent[] } {
  const asentados: ProposalEvent[] = []
  const puerto = {
    append: (e: ProposalEvent) => void asentados.push(e),
    listByProposal: () => []
  } as unknown as ProposalEventRepository
  return { puerto, asentados }
}

describe('createProposalEventLog: el asiento avisa, pero manda el asiento', () => {
  it('avisa con el id de la propuesta tras asentar', async () => {
    const { puerto, asentados } = repo()
    const avisos: string[] = []
    await createProposalEventLog(puerto, (id) => void avisos.push(id)).record(EVENTO)

    expect(asentados).toHaveLength(1)
    expect(avisos).toEqual(['p-1'])
  })

  it('si el aviso revienta, el asiento ya esta hecho y nadie se entera', async () => {
    // Avisar es cortesia para la pantalla; asentar es el libro. Una ventana
    // cerrandose no puede tumbar la fase que el operador acaba de pagar.
    const { puerto, asentados } = repo()
    const log = createProposalEventLog(puerto, () => {
      throw new Error('ventana destruida')
    })

    await expect(log.record(EVENTO)).resolves.toBeUndefined()
    expect(asentados).toHaveLength(1)
  })

  it('sin quien escuche, asienta igual', async () => {
    const { puerto, asentados } = repo()
    await createProposalEventLog(puerto).record(EVENTO)

    expect(asentados).toHaveLength(1)
  })
})
