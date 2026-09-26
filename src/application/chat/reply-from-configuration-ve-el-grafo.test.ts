import { describe, expect, it } from 'vitest'
import { agenteQueRecuerda } from '../agente-que-recuerda'
import { PROJECT } from './chat-test-fixtures'
import { replyFromConfiguration } from './reply-from-configuration'

/** BUG 2 repetido (ROADMAP #5, sub-pieza 2): `plan` BLOQUEA todo el MCP, el grafo incluido. */
describe('la entrevista de configuracion ve el grafo', () => {
  it('corre en lectura, no en plan', async () => {
    const { agent, pedidos } = agenteQueRecuerda('hola')
    await replyFromConfiguration({
      codeAgent: agent,
      project: PROJECT,
      history: [],
      onChunk: () => {}
    })

    expect(pedidos[0]?.permissionMode).toBe('lectura')
  })
})
