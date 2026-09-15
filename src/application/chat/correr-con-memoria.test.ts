import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentReply, CodeAgentRequest } from '@domain/chat/code-agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { correrConMemoria } from './correr-con-memoria'

const OK: CodeAgentReply = { text: 'hecho', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] } // prettier-ignore
// Lo que devuelve de verdad un --resume a una sesion que no existe (CLI 2.1.272).
const ROTO: Partial<CodeAgentReply> = { failed: true, turns: 0, sessionId: 'id-falso-del-cli' }
const BASE: CodeAgentRequest = { projectPath: '/p', prompt: 'x', permissionMode: 'plan', agentId: 'productor', trusted: false } // prettier-ignore

interface Cli {
  readonly agente: CodeAgent
  readonly pedidos: CodeAgentRequest[]
}

function cli(contesta: (p: CodeAgentRequest) => Partial<CodeAgentReply>): Cli {
  const pedidos: CodeAgentRequest[] = []
  const agente: CodeAgent = { isAvailable: () => true, precheck: () => null, run: (p) => (pedidos.push(p), Promise.resolve({ ...OK, ...contesta(p) })) } // prettier-ignore
  return { agente, pedidos }
}

const noop = (): void => {}

describe('correr con la memoria del hallazgo', () => {
  it('sin sesion: una corrida, y la sesion nueva queda para recordarse', async () => {
    const { agente, pedidos } = cli(() => ({ sessionId: 'ses-1', turns: 2 }))
    const c = await correrConMemoria(agente, BASE, noop, () => false)

    expect(pedidos).toHaveLength(1)
    expect(c).toMatchObject({ sesion: 'ses-1', sesionRota: false })
  })

  it('con sesion: la pide reanudar', async () => {
    const { agente, pedidos } = cli(() => ({ sessionId: 'ses-2', turns: 1 }))
    await correrConMemoria(agente, { ...BASE, reanudarSesion: 'ses-1' }, noop, () => false)

    expect(pedidos[0].reanudarSesion).toBe('ses-1')
  })

  it('GARANTIA 2: --resume roto se olvida y el turno arranca de cero, sin bloquear', async () => {
    const { agente, pedidos } = cli((p) => (p.reanudarSesion ? ROTO : { sessionId: 'ses-nueva', turns: 2 })) // prettier-ignore
    const c = await correrConMemoria(agente, { ...BASE, reanudarSesion: 'ses-borrada' }, noop, () => false) // prettier-ignore

    expect(pedidos.map((p) => p.reanudarSesion)).toEqual(['ses-borrada', undefined])
    expect(c).toMatchObject({ sesion: 'ses-nueva', sesionRota: true, reply: { failed: false } })
  })

  it('el id falso del --resume roto NUNCA se recuerda', async () => {
    const { agente } = cli((p) => (p.reanudarSesion ? ROTO : { failed: true }))
    const c = await correrConMemoria(agente, { ...BASE, reanudarSesion: 'ses-borrada' }, noop, () => false) // prettier-ignore

    expect(c.sesion).toBeUndefined()
    expect(c.sesionRota).toBe(true)
  })

  it('si el operador pulso Detener, se olvida pero NO se relanza nada', async () => {
    const { agente, pedidos } = cli(() => ROTO)
    const c = await correrConMemoria(agente, { ...BASE, reanudarSesion: 'ses-borrada' }, noop, () => true) // prettier-ignore

    expect(pedidos).toHaveLength(1)
    expect(c).toMatchObject({ sesionRota: true })
    expect(c.sesion).toBeUndefined()
  })

  it('una corrida de cero turnos no deja sesion que recordar', async () => {
    const { agente } = cli(() => ({ failed: true, turns: 0, sessionId: 'vacia' }))
    expect((await correrConMemoria(agente, BASE, noop, () => false)).sesion).toBeUndefined()
  })
})
