import { describe, expect, it } from 'vitest'
import { errorDelProveedor } from './error-del-proveedor'

/**
 * La forma MEDIDA el 2026-10-05 con la cuota de Fable agotada: el CLI sale con
 * codigo 1 y un JSON `is_error: true, subtype: 'success', api_error_status: 429`
 * cuyo `result` es el aviso. Ese texto llego al analista como si fuera su
 * analisis y la tanda se comio la baraja entera en 40 segundos.
 */
const CUOTA = { is_error: true, subtype: 'success', api_error_status: 429, result: "You've reached your Fable limit. Switch to another model" } // prettier-ignore

describe('el error del proveedor, leido de la salida del CLI', () => {
  it('el 429 de cuota se reconoce, con su estado y el aviso', () => {
    expect(errorDelProveedor(CUOTA)).toMatch(/^429: You've reached your Fable limit/)
  })

  it('el 403 de autenticacion del sabado tambien es del proveedor', () => {
    expect(errorDelProveedor({ is_error: true, api_error_status: 403, result: 'Failed to authenticate' })).toMatch(/^403/) // prettier-ignore
  })

  it('una respuesta normal no es error del proveedor', () => {
    expect(errorDelProveedor({ is_error: false, subtype: 'success', result: '{"status":"REAL"}' })).toBeNull() // prettier-ignore
  })

  it('agotar los turnos NO es del proveedor: es un limite nuestro (sin estado HTTP)', () => {
    expect(errorDelProveedor({ is_error: true, subtype: 'error_max_turns', result: '' })).toBeNull()
  })
})
