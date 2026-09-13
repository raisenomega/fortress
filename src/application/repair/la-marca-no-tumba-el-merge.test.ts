import { afterEach, describe, expect, it, vi } from 'vitest'
import { advanceProposal } from './advance-proposal'
import { bancoDelAvance } from './advance-proposal-fixture'

const RAZON = 'integracion automatica — arbol integrado medido (typecheck, lint, tests)'
const CURSOR = { last: 0 } as never

/**
 * Cuando esto corre, el fix YA ESTA EN EL REPO. Nada de lo que pase con el
 * apunte puede deshacer un merge consumado ni impedir que el camino se asiente.
 */
const quejas = (): ReturnType<typeof vi.spyOn> =>
  vi.spyOn(console, 'error').mockImplementation(() => undefined)

afterEach(() => vi.restoreAllMocks())

describe('marcar el hallazgo es un efecto del merge, no parte de el', () => {
  it('EL false NO ES ERROR: la integracion sigue, y EN SILENCIO', async () => {
    // Pasa de verdad: el operador ya la habia marcado a mano, o un juicio la
    // extinguio antes. Que no haya nada que marcar es el caso NORMAL, asi que
    // tampoco se queja — un merge que avisara de esto cada vez llenaria el log
    // de ruido y ensenaria a no leerlo.
    const log = quejas()
    const b = bancoDelAvance({ state: 'APROBADO', marcaEscribe: false })

    await expect(
      advanceProposal(b.context, b.proposal, ['MERGEADO'], RAZON, CURSOR, 1)
    ).resolves.toBeUndefined()

    expect(b.patches.map((p) => p.state)).toEqual(['MERGEADO'])
    expect(log).not.toHaveBeenCalled()
  })

  it('y si la marca LANZA, la transicion se completa igual — pero SE QUEJA', async () => {
    // No deberia —es un UPDATE de una fila— pero si la base fallara justo ahi,
    // tumbar `advanceProposal` dejaria el libro sin el asiento de un merge que
    // ya entro: el estado en disco diciendo una cosa y el repo otra. Se traga el
    // error, sin tragarse la noticia: mejor esfuerzo CON constancia.
    const log = quejas()
    const b = bancoDelAvance({ state: 'APROBADO', marcaLanza: true })

    await expect(
      advanceProposal(b.context, b.proposal, ['MERGEADO'], RAZON, CURSOR, 1)
    ).resolves.toBeUndefined()

    expect(b.patches.map((p) => p.state)).toEqual(['MERGEADO'])
    expect(log).toHaveBeenCalledOnce()
  })

  it('NO EXTINGUE: deja MITIGADO, que es desde donde la verificacion cierra', async () => {
    // Que un fix entre no prueba que el defecto se fue —esa prueba la da un
    // agente leyendo el fichero—. Extinguir aqui seria cerrar por acto de fe.
    const b = bancoDelAvance({ state: 'APROBADO' })

    await advanceProposal(b.context, b.proposal, ['MERGEADO'], RAZON, CURSOR, 1)

    // El unico escritor que se toca es `markMitigated`; nada llama a extinguir.
    expect(b.marcas).toHaveLength(1)
    expect((b.context.findings as unknown as Record<string, unknown>).markExtinct).toBeUndefined()
  })
})
