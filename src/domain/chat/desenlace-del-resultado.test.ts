import { describe, expect, it } from 'vitest'
import { err, ok } from '../shared/result'
import { ENVIO_SIN_DATO } from './desenlace-del-envio'
import { desenlaceDelResultado } from './desenlace-del-resultado'
import { negado } from './envio-negado'

const SIN = { motivo: 'sin-ediciones', edits: { porNombre: 0, porRuta: 0 } } as const

describe('lo que la cola lee de un envio, segun como volvio', () => {
  it('un turno que corrio: su cierre, tal cual', () => {
    const r = ok({ sinCierre: SIN, sinVerificar: true, plan: 'ADELANTE' as const })
    expect(desenlaceDelResultado(r)).toEqual({ sinCierre: SIN, sinVerificar: true, plan: 'ADELANTE', negado: null }) // prettier-ignore
  })

  it('sin `plan` en la salida, nadie lo juzgo: null', () => {
    expect(desenlaceDelResultado(ok({ sinCierre: null, sinVerificar: false })).plan).toBeNull()
  })

  it('NEGADO por una puerta: dice cual y con que palabras', () => {
    expect(desenlaceDelResultado(negado('barrera', 'esta muerta'))).toEqual({
      ...ENVIO_SIN_DATO,
      negado: { puerta: 'barrera', motivo: 'esta muerta' }
    })
  })

  it('un turno que revento NO es una negativa: la cola sigue', () => {
    expect(desenlaceDelResultado(err('el CLI se cayo'))).toEqual(ENVIO_SIN_DATO)
    expect(ENVIO_SIN_DATO.negado).toBeNull()
  })
})
