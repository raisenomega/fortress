import { beforeEach, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import type { NewAgentRun } from '@domain/telemetry/agent-run'
import { agenteQueAsientaCorrida } from './agente-que-asienta'
import { PETICION, RESPUESTA, agenteBase, contextoQueApunta } from './agente-que-asienta-fixture'

/**
 * Los dos casos en que NO hay fila. Van aparte de los que si la dejan porque lo
 * que se afirma es lo contrario: que el decorador se calla sin romper nada.
 */
let asentadas: NewAgentRun[]
let context: AppContext

beforeEach(() => {
  asentadas = []
  context = contextoQueApunta(asentadas)
})

describe('una corrida SIN proyecto no se asienta', () => {
  it('un sandbox no deja fila: seria huerfana, y no revienta', async () => {
    const envuelto = agenteQueAsientaCorrida(agenteBase(), context, 'sistema')

    await envuelto.run({ ...PETICION, projectId: undefined }, () => undefined)

    expect(asentadas).toEqual([])
  })

  it('y si el repositorio revienta, la respuesta llega igual', async () => {
    const roto = {
      runs: {
        record: () => {
          throw new Error('disco lleno')
        }
      }
    } as unknown as AppContext
    const envuelto = agenteQueAsientaCorrida(agenteBase(), roto, 'sistema')

    await expect(envuelto.run(PETICION, () => undefined)).resolves.toEqual(RESPUESTA)
  })
})
