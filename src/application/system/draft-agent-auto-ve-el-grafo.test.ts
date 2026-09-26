import { describe, expect, it } from 'vitest'
import type { StoredCapability } from '@domain/system/capability'
import type { AppContext } from '../context'
import { agenteQueRecuerda } from '../agente-que-recuerda'
import { draftAgentAuto } from './draft-agent-auto'

const ctx = {
  capabilities: { findById: () => ({ id: 'c1', kind: 'agente', name: 'R', originObservation: 'o' }) as StoredCapability }, // prettier-ignore
  agentDrafts: { set: (id: string, d: object) => ({ capabilityId: id, ...d, active: false }) }
} as unknown as AppContext

/** BUG 2 repetido (ROADMAP #5, sub-pieza 2): `plan` BLOQUEA todo el MCP, el grafo incluido. */
describe('el borrador automatico del agente ve el grafo', () => {
  it('corre en lectura, no en plan', async () => {
    const { agent, pedidos } = agenteQueRecuerda()
    await draftAgentAuto(ctx, 'c1', agent, '/tmp/sandbox')

    expect(pedidos[0]?.permissionMode).toBe('lectura')
  })
})
