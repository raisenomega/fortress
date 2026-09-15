import { describe, expect, it } from 'vitest'
import { cerrarCicloTerminal } from './cerrar-ciclo-terminal'
import { banco, CON_PRUEBA, HEAD, RAIZ, SIN_PRUEBA, turnoVerde } from './cerrar-ciclo-fixture'
import type { BancoDelCierre } from './cerrar-ciclo-fixture'

// El mismo fichero dos veces: el agente lo toco en dos pasos, la nota lo cita una.
const EDITS = [`${RAIZ}/src/api.ts`, `${RAIZ}/src/api.test.ts`, `${RAIZ}/src/api.ts`]
const NOTA = 'arreglado por el Terminal · turno m-1 · ficheros: src/api.ts, src/api.test.ts'

const cerrar = (b: BancoDelCierre): ReturnType<typeof cerrarCicloTerminal> =>
  cerrarCicloTerminal(b.context, 'p1', 'f1', turnoVerde(EDITS), 'm-1')

describe('el turno verde del Terminal cierra su ciclo (ADR-088, pieza 3)', () => {
  it('con foco y ediciones: marca mitigado con la nota del turno, SIN sha', async () => {
    const b = banco(CON_PRUEBA)
    await cerrar(b)

    expect(b.mitigados).toEqual([{ id: 'f1', note: NOTA, at: expect.any(String) }])
    // El Terminal no hace commit: citar el HEAD seria atribuirle un sha ajeno.
    expect(b.mitigados[0].note).not.toContain(HEAD)
    expect(b.mitigados[0].note).not.toMatch(/sha|commit/i)
  })

  it('CON PRUEBA: verifica a nombre del Terminal y aterriza EXTINCT/terminal', async () => {
    const b = banco(CON_PRUEBA)

    expect(await cerrar(b)).toEqual({ desenlace: 'extinguido' })
    expect(b.extinguidos).toEqual([
      { ids: ['f1'], at: expect.any(String), motivo: 'juicio_obsoleto', quien: 'terminal' }
    ])
  })

  it('SIN PRUEBA: sigue MITIGATED con la nota del Terminal, sin fingir Historia', async () => {
    const b = banco(SIN_PRUEBA)

    expect(await cerrar(b)).toEqual({ desenlace: 'sin_prueba' })
    expect(b.extinguidos).toHaveLength(0)
    expect(b.devueltos).toHaveLength(0)
    // Una sola marca, la del Terminal: la del analista no la pisa (exige ACTIVE).
    expect(b.mitigados.map((m) => m.note)).toEqual([NOTA])
    expect(b.anotados[0].note).toContain('Terminal')
  })

  it('SIGUE VIVO: vuelve a la cola con su dictamen, que no nombra al operador', async () => {
    const b = banco({ verdictStatus: 'REAL' })

    expect(await cerrar(b)).toEqual({ desenlace: 'sigue_vivo' })
    expect(b.devueltos).toHaveLength(1)
    expect(b.devueltos[0].note).not.toContain('operador')
  })
})

describe('las guardas: sin foco, sin red o sin ediciones no se cierra nada', () => {
  it.each([
    ['sin foco', null, turnoVerde(EDITS)],
    ['sin ediciones: nada se arreglo', 'f1', turnoVerde([])],
    ['revertido, o sin red que lo conservara', 'f1', turnoVerde(EDITS, { conservado: false })]
  ])('%s: ni marca ni lanza al analista', async (_caso, foco, turno) => {
    const b = banco(CON_PRUEBA)

    expect(await cerrarCicloTerminal(b.context, 'p1', foco, turno, 'm-1')).toBeNull()
    expect(b.mitigados).toHaveLength(0)
    expect(b.memoria).toHaveLength(0)
  })
})
