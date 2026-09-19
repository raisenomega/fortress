import { describe, expect, it } from 'vitest'
import type { CheckpointDelTurno, RedDeReversion } from '@domain/chat/red-de-reversion'
import type { VerificacionDelArbol } from '@domain/chat/verificacion-del-arbol'
import { arbitrar } from './desenlace-del-turno'
import { textOnly, type ReplyOutcome } from './reply-outcome'

const CP = { sha: 'x', conservar: () => true, revertir: () => true } as CheckpointDelTurno
const EDITO: ReplyOutcome = { ...textOnly('hecho'), edits: ['a.ts'] }
const OBJECION = 'Rompe a quien lo llama: api.ts:17 esperaba null'

/** Una red que contesta lo que se le diga del arbol. */
const redCon = (arbol: VerificacionDelArbol): RedDeReversion =>
  ({ disponible: () => true, abrir: () => CP, verificar: () => Promise.resolve(arbol) }) as RedDeReversion // prettier-ignore

/** Juez espia: apunta con que objeciones lo llamaron. */
function juezQueApunta(): { juez: never; vistas: () => readonly string[] } {
  let vistas: readonly string[] = []
  const juez = (
    _cp: unknown,
    _plan: unknown,
    objeciones: readonly string[] = []
  ): Promise<{ juzgado: true; aprobado: true }> => {
    vistas = objeciones
    return Promise.resolve({ juzgado: true as const, aprobado: true as const })
  }
  return { juez: juez as never, vistas: () => vistas }
}

/**
 * ADR-096 §13.4: el tribunal se inserta DETRAS de la guarda de `arbitrar`, entre
 * el gate y OMEGA. Aqui se fija que corre cuando debe y que sus objeciones
 * llegan al juez — el canal de la Decision 1.
 */
describe('el tribunal dentro de arbitrar', () => {
  it('con el arbol VERDE corre, y sus objeciones llegan al juez', async () => {
    const { juez, vistas } = juezQueApunta()
    const tribunal = (): Promise<readonly string[]> => Promise.resolve([OBJECION])

    const a = await arbitrar(redCon('verde'), '/p', CP, EDITO, { juez, plan: {} as never, tribunal }) // prettier-ignore

    expect(a.objeciones).toEqual([OBJECION])
    expect(vistas()).toEqual([OBJECION])
  })

  it('con DESCONOCIDA tambien corre: el critico lee, no compila', async () => {
    const { juez, vistas } = juezQueApunta()
    const tribunal = (): Promise<readonly string[]> => Promise.resolve([OBJECION])

    const a = await arbitrar(redCon('desconocida'), '/p', CP, EDITO, { juez, plan: {} as never, tribunal }) // prettier-ignore

    expect(a.arbol).toBe('desconocida')
    expect(a.objeciones).toEqual([OBJECION])
    expect(vistas()).toEqual([OBJECION])
  })

  it('sin tribunal el juez sigue juzgando, con la lista vacia (Fase A intacta)', async () => {
    const { juez, vistas } = juezQueApunta()

    const a = await arbitrar(redCon('verde'), '/p', CP, EDITO, { juez, plan: {} as never })

    expect(a.objeciones).toEqual([])
    expect(vistas()).toEqual([])
    expect(a.veredicto).toEqual({ juzgado: true, aprobado: true })
  })
})
