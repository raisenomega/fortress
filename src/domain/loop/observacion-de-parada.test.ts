import { describe, expect, it } from 'vitest'
import { observacionDeParada } from './observacion-de-parada'

/**
 * LOOP observa sus paradas (ROADMAP #5, sub-pieza 4): calco de las barreras,
 * SALE DEL DATO —el motivo cerrado y su cifra, que ya se guardan en
 * `loop_sessions`— y no de un bloque pedido al modelo. Un tope del loop es
 * FORTRESS topandose con su propio techo: `limitacion`. Romperse es `bug`.
 * Parar a mano o terminar resuelto no es un limite: nada que observar.
 *
 * Y la rama del ERROR tambien sale del dato desde el 2026-09-28: era la unica que
 * metia el mensaje crudo, y por eso bailaba. Ver `clase-del-fallo`.
 */
describe('observacionDeParada: del motivo cerrado a la observacion', () => {
  it('un TOPE es una limitacion con su cifra', () => {
    expect(observacionDeParada('tope-gasto', '$1.20 de $5.00', null)).toEqual({
      kind: 'limitacion',
      area: 'parada-del-loop',
      note: 'El loop autonomo paro por tope de gasto: $1.20 de $5.00'
    })
    expect(observacionDeParada('tope-ciclos', '3 de 3 propuestas cerradas', null)?.note).toBe('El loop autonomo paro por tope de ciclos: 3 de 3 propuestas cerradas') // prettier-ignore
    expect(observacionDeParada('tope-denegaciones', '4 denegaciones seguidas de la politica', null)?.kind).toBe('limitacion') // prettier-ignore
    expect(observacionDeParada('pool-agotado', '5 vueltas seguidas sin candidato', null)?.area).toBe('parada-del-loop') // prettier-ignore
  })

  it('sin-avance no lleva cifra y no la inventa', () => {
    expect(observacionDeParada('sin-avance', null, null)?.note).toBe(
      'El loop autonomo paro por falta de avance'
    )
  })

  it('un ERROR es un bug, y su detalle es la CLASE — nunca el mensaje', () => {
    // Este test decia «su mensaje es el detalle» y era el bug escrito: el crudo
    // bailaba en cada reintento, no tenia tope y colaba datos del cliente que el
    // cerco no alcanza. Era la UNICA rama del sistema nervioso que metia crudo.
    expect(observacionDeParada('error', null, 'TypeError, red o timeout')).toEqual({
      kind: 'bug',
      area: 'parada-del-loop',
      note: 'El loop autonomo se rompio: TypeError, red o timeout'
    })
    expect(observacionDeParada('error', null, null)?.note).toBe(
      'El loop autonomo se rompio sin clase reconocible'
    )
  })

  it('y el mensaje NO entra ni pasandolo: esa rama no lee el detalle', () => {
    // La garantia es estructural, no de disciplina del llamante.
    const nota = observacionDeParada('error', 'column "pacientes.dni" no existe', 'SqliteError')

    expect(nota?.note).toBe('El loop autonomo se rompio: SqliteError')
    expect(nota?.note).not.toContain('pacientes')
  })

  it('DETENIDO (el operador) y RESUELTO (tres 100/100) no son limites: nada que observar', () => {
    expect(observacionDeParada('detenido', null, null)).toBeNull()
    expect(observacionDeParada('resuelto', 'tres escaneos 100/100 seguidos', null)).toBeNull()
  })
})
