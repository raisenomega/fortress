import { describe, expect, it } from 'vitest'
import { banco, CON_PRUEBA, turnoVerde } from './cerrar-ciclo-fixture'
import { cerrarCicloTerminal } from './cerrar-ciclo-terminal'
import type { TurnoProtegido } from './con-red-de-reversion'
import { textOnly } from './reply-outcome'

/** Un turno conservado que USO herramientas de edicion pero no dejo ninguna ruta:
 *  el caso real que nos mordio —la telemetria vio 2 Edit y el cierre 0 rutas—. */
const sinRutas = (tools: readonly string[]): TurnoProtegido => ({
  outcome: { ...textOnly('hecho'), edits: [], tools },
  aviso: '',
  conservado: true,
  revertido: false
})

/**
 * Que guarda corto el cierre, DICHO. Antes se devolvia null a secas y «no se
 * intento» era indistinguible de «se intento y fallo»: eso costo dos
 * diagnosticos rastreando la base a mano (ADR-088, pieza 3).
 */
describe('el cierre dice QUE guarda lo corto', () => {
  it('sin foco: sin-foco, y no marca nada', async () => {
    const b = banco(CON_PRUEBA)

    // prettier-ignore
    const { cierre, sinCierre } = await cerrarCicloTerminal(b.context, 'p1', null, turnoVerde(['/repo/p1/a.ts']), 'm-1')

    expect(cierre).toBeNull()
    expect(sinCierre?.motivo).toBe('sin-foco')
    expect(b.mensajes).toHaveLength(0)
  })

  it('turno no conservado: no-conservado', async () => {
    const b = banco(CON_PRUEBA)
    const turno = turnoVerde(['/repo/p1/a.ts'], { conservado: false })

    const { sinCierre } = await cerrarCicloTerminal(b.context, 'p1', 'f1', turno, 'm-1')

    expect(sinCierre?.motivo).toBe('no-conservado')
  })

  it('sin ediciones: sin-ediciones, y deja grabado el PAR de cuentas', async () => {
    const b = banco(CON_PRUEBA)
    const turno = sinRutas(['Bash', 'Edit', 'Edit'])

    const { cierre, sinCierre } = await cerrarCicloTerminal(b.context, 'p1', 'f1', turno, 'm-1')

    expect(cierre).toBeNull()
    expect(sinCierre?.motivo).toBe('sin-ediciones')
    // La divergencia que hubo que rastrear a mano queda grabada: 2 frente a 0.
    expect(sinCierre?.edits).toEqual({ porNombre: 2, porRuta: 0 })
    // Enum y numeros: lo que se persiste no puede llevar rutas del proyecto.
    expect(JSON.stringify(sinCierre)).not.toMatch(/\//)
  })

  it('cuando SI cierra no hay motivo de fallo que registrar', async () => {
    const b = banco(CON_PRUEBA)
    const turno = turnoVerde(['/repo/p1/a.ts'])

    const { cierre, sinCierre } = await cerrarCicloTerminal(b.context, 'p1', 'f1', turno, 'm-1')

    expect(sinCierre).toBeNull()
    expect(cierre).not.toBeNull()
  })
})
