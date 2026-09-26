import { describe, expect, it } from 'vitest'
import { observacionDeParada, observacionDeStandby } from './observacion-de-parada'

/**
 * LOOP observa sus paradas (ROADMAP #5, sub-pieza 4): calco de las barreras,
 * SALE DEL DATO —el motivo cerrado y su cifra, que ya se guardan en
 * `loop_sessions`— y no de un bloque pedido al modelo. Un tope del loop es
 * FORTRESS topandose con su propio techo: `limitacion`. Romperse es `bug`.
 * Parar a mano o terminar resuelto no es un limite: nada que observar.
 */
describe('observacionDeParada: del motivo cerrado a la observacion', () => {
  it('un TOPE es una limitacion con su cifra', () => {
    expect(observacionDeParada('tope-gasto', '$1.20 de $5.00')).toEqual({
      kind: 'limitacion',
      area: 'parada-del-loop',
      note: 'El loop autonomo paro por tope de gasto: $1.20 de $5.00'
    })
    expect(observacionDeParada('tope-ciclos', '3 de 3 propuestas cerradas')?.note).toBe('El loop autonomo paro por tope de ciclos: 3 de 3 propuestas cerradas') // prettier-ignore
    expect(observacionDeParada('tope-denegaciones', '4 denegaciones seguidas de la politica')?.kind).toBe('limitacion') // prettier-ignore
    expect(observacionDeParada('pool-agotado', '5 vueltas seguidas sin candidato')?.area).toBe('parada-del-loop') // prettier-ignore
  })

  it('sin-avance no lleva cifra y no la inventa', () => {
    expect(observacionDeParada('sin-avance', null)?.note).toBe(
      'El loop autonomo paro por falta de avance'
    )
  })

  it('un ERROR es un bug, y su mensaje es el detalle', () => {
    expect(observacionDeParada('error', 'el proceso termino con codigo 143')).toEqual({
      kind: 'bug',
      area: 'parada-del-loop',
      note: 'El loop autonomo se rompio: el proceso termino con codigo 143'
    })
    expect(observacionDeParada('error', null)?.note).toBe('El loop autonomo se rompio sin mensaje')
  })

  it('DETENIDO (el operador) y RESUELTO (tres 100/100) no son limites: nada que observar', () => {
    expect(observacionDeParada('detenido', null)).toBeNull()
    expect(observacionDeParada('resuelto', 'tres escaneos 100/100 seguidos')).toBeNull()
  })
})

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
