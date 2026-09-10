import { describe, expect, it } from 'vitest'
import { arcoLleno, loQueEnsena } from './gauge-look'

describe('el gauge no ensena un numero que no significa nada', () => {
  it('con un recorrido EN MARCHA no ensena el score, aunque haya uno', () => {
    // El de `projects` es el ANTERIOR: updateScan vive en el cierre. Ensenar
    // "86 verde" mientras se descubre un CRITICAL afirma tranquilidad.
    expect(loQueEnsena(true, true)).toBe('en-curso')
    expect(arcoLleno(loQueEnsena(true, true))).toBe(false)
  })

  it('terminado y con escaneo previo, el numero manda', () => {
    expect(loQueEnsena(true, false)).toBe('score')
    expect(arcoLleno(loQueEnsena(true, false))).toBe(true)
  })

  it('sin escanear sigue siendo un guion: el 0 es desconocido, no malo', () => {
    expect(loQueEnsena(false, false)).toBe('sin-escanear')
    expect(arcoLleno(loQueEnsena(false, false))).toBe(false)
  })

  it('el recorrido manda sobre el resto: sin escaneo previo y corriendo, en curso', () => {
    expect(loQueEnsena(false, true)).toBe('en-curso')
  })
})
