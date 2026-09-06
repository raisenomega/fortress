import { describe, expect, it } from 'vitest'
import { leeGuardsDeLaTabla } from './guards-de-la-tabla'
import { leeGuardsDelCodigo } from './guards-del-codigo'

/**
 * La columna "Guards" de docs/IPC.md es el contrato que se lee para saber que
 * protege cada canal, y nada la ataba al codigo: se escribia a mano y se
 * quedaba quieta cuando el handler cambiaba. Cuando este test se escribio ya
 * habia derivado en dos canales —`graph:install` y `push:run` decian "—" con el
 * guard puesto—, y la tabla es justo lo que consulta quien juzga si un guard
 * falta por descuido o por decision. Una tabla que miente en esa pregunta no es
 * documentacion vieja: es un veredicto equivocado esperando.
 */
const codigo = leeGuardsDelCodigo()
const tabla = leeGuardsDeLaTabla()

const conTurno = (m: Map<string, readonly string[]>): string[] =>
  [...m].filter(([, guards]) => guards.length > 0).map(([canal]) => canal).sort() // prettier-ignore

describe('la columna Guards de docs/IPC.md dice lo que el codigo hace', () => {
  it('los dos lados se leen: ni la tabla ni los registros salen vacios', () => {
    expect(codigo.size).toBeGreaterThan(100)
    expect(tabla.size).toBeGreaterThan(100)
  })

  it('los canales que toman turno son los mismos en la tabla y en el codigo', () => {
    expect(conTurno(tabla)).toEqual(conTurno(codigo))
  })

  it('y cada uno toma el MISMO turno en las dos', () => {
    for (const canal of conTurno(codigo)) {
      expect({ canal, guards: tabla.get(canal) }).toEqual({ canal, guards: codigo.get(canal) })
    }
  })

  it('la ausencia que `repair:withdraw` declara no se lee como presencia', () => {
    // "**sin** guardRun" es la unica fila que nombra un guard para negarlo.
    expect(tabla.get('repair:withdraw')).toEqual([])
    expect(codigo.get('repair:withdraw')).toEqual([])
  })
})
