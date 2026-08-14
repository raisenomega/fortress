import { describe, expect, it } from 'vitest'
import { reasonBody, retryLineage } from './repair-proposal-badges'

describe('reasonBody: la razon sin lo que el badge ya dice', () => {
  it('sin linaje: la razon entera, tal cual', () => {
    expect(reasonBody('el fix no cubre la fuga')).toBe('el fix no cubre la fuga')
  })

  it('con linaje: quita el prefijo de maquina y su separador', () => {
    // "retry de 1225c9a7" ya sale como badge; repetirlo gastaria la primera
    // linea del texto en algo ya dicho, y ademas en formato de maquina.
    const razon = 'retry_of=1225c9a7; el analisis sigue siendo REAL'
    expect(reasonBody(razon)).toBe('el analisis sigue siendo REAL')
    expect(retryLineage(razon)).toBe('1225c9a7')
  })

  it('acepta la raya larga del evento, no solo el punto y coma', () => {
    const razon = 'retry_of=1225c9a7 — reintento explicito del operador'
    expect(reasonBody(razon)).toBe('reintento explicito del operador')
  })

  it('linaje sin cuerpo: cadena vacia, no el prefijo suelto', () => {
    // Al nacer, la propuesta de reintento solo lleva el linaje. Devolver
    // "retry_of=..." pintaria una linea que no dice nada al operador.
    expect(reasonBody('retry_of=1225c9a7')).toBe('')
  })

  it('sin razon: cadena vacia', () => {
    expect(reasonBody(undefined)).toBe('')
  })
})
