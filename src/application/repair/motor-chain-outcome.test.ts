import { describe, expect, it } from 'vitest'
import { describir, esAveria, esDenegacion } from './motor-chain-outcome'

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

describe('describir: una parada en el gate no se anuncia como integrada', () => {
  it('el kind nuevo tiene su propia frase, sin caer en la de integrada', () => {
    // El `return` final del describir se tragaba cualquier kind no cubierto.
    // Contar como integrada algo que solo llego al gate seria la peor linea
    // posible en el chat: el operador creeria que su repo ya cambio.
    const texto = describir({ kind: 'espera-omega', proposalId: 'prop-1234abcd' })

    expect(texto).toContain('gate verde')
    expect(texto).not.toContain('integrada')
    expect(texto).toContain('prop-123')
  })
})
