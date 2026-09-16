import { afterEach, describe, expect, it, vi } from 'vitest'
import * as verificar from '../repair/verificar-mitigado'
import { hallazgo } from '../repair/plan-repair-fixture'
import { cerrarCicloTerminal, cerrarYContar } from './cerrar-ciclo-terminal'
import { banco, CON_PRUEBA, RAIZ, RESPUESTA, turnoVerde } from './cerrar-ciclo-fixture'

afterEach(() => vi.restoreAllMocks())

const TURNO = turnoVerde([`${RAIZ}/src/api.ts`])
const MATADO = 'El analista no llego a terminar'
const lanza = (): void => void vi.spyOn(verificar, 'verificarMitigado').mockRejectedValue(new Error(MATADO)) // prettier-ignore

describe('LA LINEA ROJA: marcar y no poder verificar NO deja un mitigado mudo', () => {
  it('la verificacion LANZA tras marcar: MITIGATED con rastro de pendiente, no verificado', async () => {
    lanza()
    const b = banco(CON_PRUEBA)

    const cierre = await cerrarCicloTerminal(b.context, 'p1', 'f1', TURNO, 'm-1')

    expect(cierre.cierre).toEqual({ desenlace: 'pendiente', motivo: MATADO })
    expect(b.mitigados).toHaveLength(1)
    expect(b.extinguidos).toHaveLength(0)
    expect(b.anotados).toEqual([{ id: 'f1', note: expect.stringMatching(/^pendiente de verificar: /) }]) // prettier-ignore
    expect(b.anotados[0].note).toContain(MATADO)
    expect(b.anotados[0].note).toContain('NO esta verificado')
  })

  it('la verificacion NO llega a lanzarse (propuesta viva del motor): el mismo rastro', async () => {
    const b = banco({ ...CON_PRUEBA, liveIds: ['f1'] })

    const cierre = await cerrarCicloTerminal(b.context, 'p1', 'f1', TURNO, 'm-1')

    expect(cierre.cierre?.desenlace).toBe('pendiente')
    expect(b.memoria).toHaveLength(0)
    expect(b.anotados[0].note).toMatch(/^pendiente de verificar: .*propuesta viva/)
  })

  it('y el TURNO lo cuenta: un aviso del sistema que dice pendiente, nunca cerrado', async () => {
    lanza()
    const b = banco(CON_PRUEBA)

    await cerrarYContar(b.context, 'f1', TURNO, RESPUESTA)

    expect(b.mensajes).toHaveLength(1)
    expect(b.mensajes[0]).toMatchObject({ projectId: 'p1', role: 'system', agentId: null })
    expect(b.mensajes[0].content).toContain('PENDIENTE de verificar')
    expect(b.mensajes[0].content).toContain(MATADO)
    expect(b.mensajes[0].content).not.toContain('Historia')
  })
})

describe('lo que no se marco no se toca', () => {
  it('el hallazgo dejo de estar activo durante el turno: ni marca, ni verifica, ni anota', async () => {
    // Si el operador lo marco a mano mientras el turno trabajaba, su nota manda.
    const b = banco(CON_PRUEBA, { ...hallazgo('f1', 'src/api.ts'), lifecycle: 'MITIGATED' })

    expect((await cerrarCicloTerminal(b.context, 'p1', 'f1', TURNO, 'm-1')).cierre).toEqual({ desenlace: 'no_vivo' }) // prettier-ignore
    expect(b.memoria).toHaveLength(0)
    expect(b.anotados).toHaveLength(0)
  })

  it('sin cierre que contar, el turno no escribe ningun aviso', async () => {
    const b = banco(CON_PRUEBA)

    await cerrarYContar(b.context, null, TURNO, RESPUESTA)

    expect(b.mensajes).toHaveLength(0)
  })
})
