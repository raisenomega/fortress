import { describe, expect, it } from 'vitest'
import { nombreDelActo, queFirma } from './acto-de-firmar'

describe('firmar se reserva para lo que mueve el repo', () => {
  it('en GATE el boton NO se llama firmar: solo pide una opinion', () => {
    // Pulsar en GATE corre el revisor y no toca el arbol vivo. Llamarlo
    // "Firmar" entrenaba a pulsar sin mirar el estado.
    expect(nombreDelActo('GATE')).toBe('Pedir revision')
    expect(nombreDelActo('GATE').toLowerCase()).not.toContain('firm')
  })

  it('en OMEGA si: ahi firmar es integrar', () => {
    expect(nombreDelActo('OMEGA')).toBe('Firmar')
  })

  it('el nombre corto cambia con el estado', () => {
    expect(nombreDelActo('GATE')).not.toBe(nombreDelActo('OMEGA'))
  })
})

describe('queFirma: el titulo dice que pasa exactamente al pulsar', () => {
  it('en GATE avisa de que NO integra nada todavia', () => {
    expect(queFirma('GATE')).toContain('No integra nada todavia')
    expect(queFirma('GATE')).toContain('corre el revisor')
  })

  it('en OMEGA dice que integra: el revisor ya hablo', () => {
    expect(queFirma('OMEGA')).toContain('integra el fix')
  })

  it('los dos textos son distintos: si no, el boton mentiria en uno', () => {
    expect(queFirma('GATE')).not.toBe(queFirma('OMEGA'))
  })
})
