import { beforeEach, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import type { NewAgentRun } from '@domain/telemetry/agent-run'
import { agenteQueAsientaCorrida } from './agente-que-asienta'
import { PETICION, RESPUESTA, agenteBase, contextoQueApunta } from './agente-que-asienta-fixture'

let asentadas: NewAgentRun[]
let context: AppContext

beforeEach(() => {
  asentadas = []
  context = contextoQueApunta(asentadas)
})

describe('el agente envuelto deja su corrida asentada', () => {
  it('una corrida, una fila, con kind sistema y la factura real', async () => {
    const envuelto = agenteQueAsientaCorrida(agenteBase(), context, 'sistema')

    await envuelto.run(PETICION, () => undefined)

    expect(asentadas).toHaveLength(1)
    expect(asentadas[0]).toMatchObject({
      projectId: 'p1',
      kind: 'sistema',
      failed: false,
      usage: RESPUESTA.usage,
      tools: ['Read']
    })
  })

  it('mide la duracion alrededor del await: no queda en cero', async () => {
    const envuelto = agenteQueAsientaCorrida(agenteBase(25), context, 'sistema')

    await envuelto.run(PETICION, () => undefined)

    expect(asentadas[0].durationMs).toBeGreaterThan(0)
  })

  it('devuelve la respuesta intacta: observa, no cambia', async () => {
    const envuelto = agenteQueAsientaCorrida(agenteBase(), context, 'sistema')

    await expect(envuelto.run(PETICION, () => undefined)).resolves.toEqual(RESPUESTA)
  })
})
