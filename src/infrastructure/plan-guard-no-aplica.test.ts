import { beforeEach, describe, expect, it } from 'vitest'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AppContext } from '@application/context'
import { olvidarAprobacion } from './aprobacion-del-plan'
import { guardPlanAprobado } from './plan-guard'

const conBase = (modo: string): AppContext =>
  ({
    settings: { get: (k: string) => (k === SETTINGS_KEYS.operationMode ? modo : null) }
  }) as unknown as AppContext

/** Un turno que ejecuta un hallazgo del lote. `mode` es lo que diga el mensaje. */
const ejecucion = (mode: 'autonomo' | 'supervisado', findingId = 'A'): SendMessageInput =>
  ({ projectId: 'p1', prompt: 'x', mode, excludedAgents: [], findingId, lote: ['A', 'B'] }) as SendMessageInput // prettier-ignore

beforeEach(() => olvidarAprobacion('p1'))

/**
 * ADR-097 §4. A quien la puerta NO le aplica. Aparte del fichero del rechazo
 * porque son dos preguntas —a quien bloquea y a quien deja pasar— y una puerta
 * que bloquea de mas es tan mala como una que no bloquea: aqui se fija que solo
 * muerde donde debe.
 */
describe('a quien NO le aplica la puerta', () => {
  it('un turno suelto —sin lote— pasa: no hubo plan que aprobar', () => {
    const suelto = { projectId: 'p1', prompt: 'x', mode: 'autonomo', excludedAgents: [], findingId: 'A' } as SendMessageInput // prettier-ignore

    expect(guardPlanAprobado(conBase('autonomo'), suelto)).toBeNull()
  })

  it('el turno de PLAN —lote sin foco— pasa: no edita nada, es el que se juzga', () => {
    const plan = { projectId: 'p1', prompt: 'x', mode: 'supervisado', excludedAgents: [], lote: ['A', 'B'] } as SendMessageInput // prettier-ignore

    expect(guardPlanAprobado(conBase('autonomo'), plan)).toBeNull()
  })

  it('en SUPERVISADO no aplica: alli el Enter del operador es la autorizacion', () => {
    expect(guardPlanAprobado(conBase('supervisado'), ejecucion('autonomo'))).toBeNull()
  })
})
