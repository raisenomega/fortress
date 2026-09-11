import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hijoFalso } from './hijo-falso-fixture'
import { collectRun, SIN_TECHO, TECHO_POR_DEFECTO } from './run-claude-process'

const UNA_HORA = 60 * 60 * 1000

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('SIN_TECHO: el proceso corre lo que necesite', () => {
  it('pasada una HORA no se le ha mandado ninguna señal', () => {
    const child = hijoFalso()
    void collectRun(child, () => undefined, SIN_TECHO)

    vi.advanceTimersByTime(UNA_HORA)

    expect(child.killed).toEqual([])
  })

  it('y sigue resolviendo normal cuando el proceso cierra', async () => {
    const child = hijoFalso()
    const corrida = collectRun(child, () => undefined, SIN_TECHO)

    vi.advanceTimersByTime(UNA_HORA)
    child.cerrar()

    await expect(corrida).resolves.toMatchObject({ failed: false })
  })
})

describe('el default no cambia: quien no pide nada conserva su reloj', () => {
  it('a los 15 minutos le llega SIGTERM', () => {
    const child = hijoFalso()
    void collectRun(child, () => undefined)

    vi.advanceTimersByTime(TECHO_POR_DEFECTO + 1)

    expect(child.killed).toEqual(['SIGTERM'])
  })

  it('un minuto antes, todavia no', () => {
    const child = hijoFalso()
    void collectRun(child, () => undefined)

    vi.advanceTimersByTime(TECHO_POR_DEFECTO - 60_000)

    expect(child.killed).toEqual([])
  })

  it('y el techo se DESARMA al cerrar: no mata a un proceso que ya termino', () => {
    const child = hijoFalso()
    void collectRun(child, () => undefined)

    child.cerrar()
    vi.advanceTimersByTime(UNA_HORA)

    expect(child.killed).toEqual([])
  })
})
