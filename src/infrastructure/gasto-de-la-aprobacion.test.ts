import { beforeEach, describe, expect, it } from 'vitest'
import {
  aprobarLote,
  gastarAprobacion,
  hallazgoAprobado,
  olvidarAprobacion
} from './aprobacion-del-plan'

const LOTE = ['A', 'B', 'C']
const estado = (ids: readonly string[] = LOTE): readonly boolean[] =>
  ids.map((id) => hallazgoAprobado('p1', id))

beforeEach(() => olvidarAprobacion('p1'))

/**
 * BUG 1, caducidad (b). El permiso autoriza UN intento, no un resultado: el
 * hallazgo que ya arranco su turno sale del conjunto. Aparte de la caducidad
 * (a) porque cierran fugas distintas —replanear vs. usar dos veces— y juntas
 * pasaban de 75 lineas.
 */
describe('(b) el permiso se gasta al usarse', () => {
  it('un hallazgo que ya corrio NO vuelve a estar aprobado', () => {
    aprobarLote('p1', LOTE)

    gastarAprobacion('p1', 'B')

    expect(estado()).toEqual([true, false, true])
  })

  it('gastar uno NO toca a sus hermanos: el lote sigue corriendo', () => {
    aprobarLote('p1', LOTE)

    gastarAprobacion('p1', 'A')
    gastarAprobacion('p1', 'B')

    expect(estado()).toEqual([false, false, true])
  })

  it('gastar lo que no esta es inocuo: quien llama no tiene que preguntar', () => {
    // Se llama para CUALQUIER turno con foco, incluso en supervisado, donde
    // nadie aprueba nada. Una guarda que hay que acordarse de activar es media.
    aprobarLote('p1', LOTE)

    gastarAprobacion('p1', 'ajeno')
    gastarAprobacion('otro', 'A')

    expect(estado()).toEqual([true, true, true])
  })
})
