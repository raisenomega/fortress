import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * PASO 153: que la X mate todo. El main FUERZA la salida (app.exit) DESPUES de
 * alSalir() —que mata los hijos YA y cierra la base con checkpoint WAL de forma
 * sincrona—, para que el WAL quede consistente antes de salir. Pin del ORDEN:
 * invertirlo (exit antes que alSalir) dejaria la base sin cerrar (M2).
 */
const index = readFileSync('src/main/index.ts', 'utf8')

describe('el cierre fuerza la salida DESPUES de cerrar la base', () => {
  it('will-quit llama alSalir() y LUEGO app.exit(0)', () => {
    const iSalir = index.indexOf('alSalir()')
    const iExit = index.indexOf('app.exit(0)')
    expect(iSalir).toBeGreaterThan(-1)
    expect(iExit).toBeGreaterThan(iSalir)
  })
})
