import { describe, expect, it } from 'vitest'
import { observacionDeStandby } from './observacion-de-parada'

/**
 * La GEMELA de la parada, y la que llevaba razon desde el principio: clasifica por
 * causa y no mete el texto crudo. Sale a su fichero porque el de su hermana llego
 * al tope de lineas al alinearla con este patron (2026-09-28).
 */
describe('observacionDeStandby: el proveedor caido, clasificado y sin el texto crudo', () => {
  it.each([
    ['429 Too Many Requests', 'limite de tasa'],
    ['insufficient credit balance', 'credito o cuota'],
    ['503 overloaded', 'proveedor caido o sobrecargado'],
    ['read ECONNRESET', 'red o timeout'],
    ['already running', 'otro proceso en marcha'],
    ['algo raro', 'sin clasificar']
  ])('«%s» -> %s', (error, clase) => {
    expect(observacionDeStandby(error)).toEqual({
      kind: 'limitacion',
      area: 'standby-del-loop',
      note: `El loop autonomo entro en STANDBY por un fallo transitorio del proveedor: ${clase}`
    })
  })

  it('el texto crudo del error NO entra: puede llevar rutas del cliente y bailaria en cada reintento', () => {
    expect(observacionDeStandby('ETIMEDOUT /home/cliente/repo').note).not.toContain('/home')
  })
})
