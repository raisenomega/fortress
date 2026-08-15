import { describe, expect, it } from 'vitest'
import { esAveria, esDenegacion } from './motor-chain-outcome'

describe('esDenegacion: apagar la integracion no es que te la denieguen', () => {
  it('las cuatro condiciones con la politica activa cuentan', () => {
    // La politica miro el fix y lo freno por un criterio concreto. Eso es lo
    // que una racha de denegaciones tiene que contar.
    expect(esDenegacion('severity')).toBe(true)
    expect(esDenegacion('diff')).toBe(true)
    expect(esDenegacion('files')).toBe(true)
    expect(esDenegacion('blacklist')).toBe(true)
  })

  it('la integracion apagada NO cuenta', () => {
    // Un proyecto que la apago quiere que todo espere firma: cada propuesta
    // aprobada saliendo por ahi es lo pedido. Contarla frenaria al operador
    // por haber elegido bien, y a las pocas vueltas.
    expect(esDenegacion('disabled')).toBe(false)
  })

  it('sin condicion tampoco: ahi ni se miro la politica', () => {
    expect(esDenegacion(null)).toBe(false)
  })
})

describe('esAveria: solo lo que se arregla esperando', () => {
  it('las tres que pueden traer un fallo del proveedor detras', () => {
    expect(esAveria('generator_error')).toBe(true)
    expect(esAveria('omega_timeout')).toBe(true)
    expect(esAveria('omega_error')).toBe(true)
  })

  it('un veto o un gate en rojo son veredictos, no averias', () => {
    expect(esAveria('omega_vetado')).toBe(false)
    expect(esAveria('gate_failed')).toBe(false)
    expect(esAveria('scope_violation')).toBe(false)
  })
})
