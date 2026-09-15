import { describe, expect, it } from 'vitest'
import { seResuelveEnTerminal } from './se-resuelve-en-terminal'

describe('en que filas se ofrece «Resolver en Terminal»', () => {
  it('en una fila abierta que nadie ha dado por arreglada: SI', () => {
    expect(seResuelveEnTerminal({ dismissed: false, mitigado: false })).toBe(true)
  })

  it('en una descartada: NO, su dueño ya dijo que no era un problema', () => {
    expect(seResuelveEnTerminal({ dismissed: true, mitigado: false })).toBe(false)
  })

  it('en una mitigada: NO, ya hay un fix y lo que le toca es verificarse', () => {
    expect(seResuelveEnTerminal({ dismissed: false, mitigado: true })).toBe(false)
  })

  it('descartada y mitigada a la vez: tampoco', () => {
    expect(seResuelveEnTerminal({ dismissed: true, mitigado: true })).toBe(false)
  })
})
