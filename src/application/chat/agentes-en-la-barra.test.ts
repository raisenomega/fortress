import { describe, expect, it } from 'vitest'
import type { CodeAgent } from '@domain/chat/code-agent'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { StepProgress } from '../workflow/step-progress'
import { PROJECT } from './chat-test-fixtures'
import { replyFromChat } from './reply-from-chat'

const cli: CodeAgent = {
  isAvailable: () => true,
  precheck: () => null,
  run: () => Promise.resolve({ text: 'hecho', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] }) // prettier-ignore
}

/** Lo que la barra recibe durante un turno. */
async function loQueVeLaBarra(agentes?: number): Promise<readonly StepProgress[]> {
  const pasos: StepProgress[] = []
  const noop = (): void => {}
  // prettier-ignore
  await replyFromChat({ codeAgent: cli, project: PROJECT, corpus: EMPTY_CORPUS, prompt: 'arregla', mode: 'autonomo', excludedAgents: [], onStep: (p) => pasos.push(p), onChunk: noop, known: [], isCancelled: () => false, enFoco: 'un hallazgo', agentes })
  return pasos
}

/**
 * ADR-097, punto 1. El medidor ya sabia pintar «X/N agentes» —lo hace en los
 * workflows— pero el turno con foco le mandaba siempre un 1. En el ensayo del
 * 18-sep corrieron TRES y la barra enseño los datos de UNO.
 */
describe('la barra recibe cuantos agentes intervienen', () => {
  it('con tres agentes emite total 3, no 1', async () => {
    const pasos = await loQueVeLaBarra(3)

    expect(pasos.map((p) => p.total)).toEqual([3, 3])
  })

  it('lo emite al ARRANCAR, no solo al final: la barra habla mientras corre', async () => {
    // Si solo saliera al cerrar, el operador miraria seis minutos de nada — que
    // es exactamente lo que paso en el ensayo.
    expect((await loQueVeLaBarra(3))[0]).toMatchObject({ index: 0, total: 3 })
  })

  it('sin el dato se comporta como antes: un solo agente', async () => {
    // Los caminos que no lo pasan —la API de texto, los tests de otra cosa— no
    // cambian de comportamiento por esta pieza.
    expect((await loQueVeLaBarra())[0]?.total).toBe(1)
  })

  it('el coste llega con el total, no despues: la barra no miente a medias', async () => {
    const [, cierre] = await loQueVeLaBarra(2)

    expect(cierre).toMatchObject({ total: 2 })
  })
})
