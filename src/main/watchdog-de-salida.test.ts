import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { armarWatchdog } from './watchdog-de-salida'

describe('armarWatchdog: NETEA la terminacion si app.exit se estanca (la X)', () => {
  it('al vencer el plazo, fuerza salir(codigo) UNA vez', () => {
    const salir = vi.fn()
    const cap: { cb: () => void } = { cb: () => undefined }
    const timer = vi.fn((cb: () => void) => {
      cap.cb = cb
      return { unref: vi.fn() }
    })
    armarWatchdog(0, { timer, salir, ms: 2000 })
    expect(salir).not.toHaveBeenCalled() // aun no vence: un proceso sano muere antes
    cap.cb() // vence el plazo (el main seguia vivo)
    // Mutante: no armar el timer -> `cap.cb` sigue no-op -> salir nunca -> ROJO.
    expect(salir).toHaveBeenCalledTimes(1)
    expect(salir).toHaveBeenCalledWith(0)
  })

  it('el timer va unref() -> no sostiene un proceso sano', () => {
    const unref = vi.fn()
    const timer = vi.fn(() => ({ unref }))
    armarWatchdog(0, { timer, salir: vi.fn(), ms: 2000 })
    // Mutante: quitar `t.unref()` -> ROJO (el watchdog colgaria un proceso sano).
    expect(unref).toHaveBeenCalledTimes(1)
  })

  it('arma con el codigo y el plazo dados', () => {
    const timer = vi.fn(() => ({ unref: vi.fn() }))
    armarWatchdog(3, { timer, salir: vi.fn(), ms: 2000 })
    expect(timer).toHaveBeenCalledWith(expect.any(Function), 2000)
  })
})

describe('cableado en will-quit: el watchdog se arma ENTRE alSalir y app.exit', () => {
  it('el orden en index.ts es alSalir -> armarWatchdog -> app.exit', () => {
    const index = readFileSync('src/main/index.ts', 'utf8')
    const iSalir = index.indexOf('alSalir()')
    const iArma = index.indexOf('armarWatchdog(0)')
    const iExit = index.indexOf('app.exit(0)')
    expect(iSalir).toBeGreaterThan(-1)
    expect(iArma).toBeGreaterThan(iSalir) // despues del checkpoint del WAL
    expect(iExit).toBeGreaterThan(iArma) // y antes de rendir a app.exit
  })
})
