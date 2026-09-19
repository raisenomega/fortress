import { beforeEach, describe, expect, it } from 'vitest'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AppContext } from '@application/context'
import { aprobarLote, olvidarAprobacion } from './aprobacion-del-plan'
import { guardPlanAprobado, SIN_APROBACION } from './plan-guard'

const conBase = (modo: string): AppContext =>
  ({
    settings: { get: (k: string) => (k === SETTINGS_KEYS.operationMode ? modo : null) }
  }) as unknown as AppContext

/** Un turno que ejecuta un hallazgo del lote. `mode` es lo que diga el mensaje. */
const ejecucion = (mode: 'autonomo' | 'supervisado', findingId = 'A'): SendMessageInput =>
  ({ projectId: 'p1', prompt: 'x', mode, excludedAgents: [], findingId, lote: ['A', 'B'] }) as SendMessageInput // prettier-ignore

beforeEach(() => olvidarAprobacion('p1'))

/**
 * ADR-097 §4, la puerta. Escrito desde el angulo del ATACANTE: no comprueba que
 * la funcion exista, sino que los caminos para saltarsela NO funcionan.
 */
describe('en autonomo, un lote sin aprobacion NO corre', () => {
  it('sin el ADELANTE de OMEGA: rechazado', () => {
    expect(guardPlanAprobado(conBase('autonomo'), ejecucion('autonomo'))).toBe(SIN_APROBACION)
  })

  it('EL INTENTO DE SALTARSELA: el mensaje dice «supervisado», la base dice autonomo', () => {
    // Es el camino real: `lote-por-enter.ts:33` ya manda `supervisado` a
    // proposito. Si la puerta leyera `input.mode`, cualquiera que copiase esa
    // linea pasaria. Lee `modoGuardado`, asi que no.
    const input = ejecucion('supervisado')

    expect(input.mode).toBe('supervisado')
    expect(guardPlanAprobado(conBase('autonomo'), input)).toBe(SIN_APROBACION)
  })

  it('el rechazo DICE por que: no se niega en silencio', () => {
    const razon = guardPlanAprobado(conBase('autonomo'), ejecucion('autonomo'))

    expect(razon).toContain('OMEGA')
    expect(razon).toContain('sin eso')
  })
})

describe('lo aprobado SI corre: la puerta no bloquea todo', () => {
  it('con el ADELANTE de OMEGA sobre ese lote: pasa', () => {
    aprobarLote('p1', ['A', 'B'])

    expect(guardPlanAprobado(conBase('autonomo'), ejecucion('autonomo'))).toBeNull()
  })

  it('la aprobacion es de ESOS hallazgos: otro id NO pasa', () => {
    // Aprobar el lote [A,B] no autoriza a ejecutar C. Si la aprobacion fuera
    // «este proyecto esta aprobado», cambiar la seleccion colaria lo nuevo.
    aprobarLote('p1', ['A', 'B'])

    expect(guardPlanAprobado(conBase('autonomo'), ejecucion('autonomo', 'C'))).toBe(SIN_APROBACION)
  })

  it('y es de ESE proyecto: aprobar otro no abre este', () => {
    aprobarLote('otro', ['A', 'B'])

    expect(guardPlanAprobado(conBase('autonomo'), ejecucion('autonomo'))).toBe(SIN_APROBACION)
  })
})
