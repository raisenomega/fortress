import { describe, expect, it } from 'vitest'
import type { StoredCapability } from '@domain/system/capability'
import type { CapabilityEpisode } from '@domain/system/capability-episode'
import { claudeModeArg } from '@domain/settings/permission-mode'
import type { AppContext } from '../context'
import { agenteQueRecuerda } from '../agente-que-recuerda'
import { runLearningEpisode } from './run-learning-episode'

const ctx = {
  capabilities: { findById: () => ({ id: 'c1', name: 'R' }) as StoredCapability },
  agentDrafts: { get: () => null },
  capabilityEpisodes: { record: (e: object) => ({ ...e, id: 'e1' }) as CapabilityEpisode }
} as unknown as AppContext

/** BUG 2 repetido (ROADMAP #5, sub-pieza 2): `plan` BLOQUEA todo el MCP, el grafo incluido. */
describe('el episodio de aprendizaje ve el grafo', () => {
  it('corre en lectura, no en plan', async () => {
    const { agent, pedidos } = agenteQueRecuerda('EPISODE: {"outcome":"ok","summary":"s"}')
    await runLearningEpisode(ctx, 'c1', agent, '/tmp/sandbox')

    expect(pedidos[0]?.permissionMode).toBe('lectura')
    expect(claudeModeArg('lectura')).toBe('default')
  })
})
