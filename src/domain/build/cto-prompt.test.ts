import { describe, expect, it } from 'vitest'
import { CONSIGNA_CTO, promptCto } from './cto-prompt'

/** PASO 126: el contrato del Modo CTO como prompt — tres leyes + bloque PASO. */

describe('PROMPT DEL CONTRATO: las tres leyes y el bloque PASO', () => {
  it('las tres leyes LITERALES, con NUNCA FIRMA como pin', () => {
    expect(CONSIGNA_CTO).toContain('PENSAR LIBRE')
    expect(CONSIGNA_CTO).toContain('MEDIR ANTES DE OPINAR')
    expect(CONSIGNA_CTO).toContain('NUNCA FIRMA')
  })

  it('el esqueleto del bloque PASO es el UNICO formato de salida', () => {
    const secciones = ['EL HECHO', 'METODO', 'PASOS', 'LA INCOGNITA', 'VERIFICAR', 'REPORTA', 'CIERRE'] // prettier-ignore
    for (const s of secciones) expect(CONSIGNA_CTO).toContain(s)
  })

  it('el hilo viaja entero en formato Operador/Tu y la pregunta cierra', () => {
    const hilo = [
      { role: 'user', text: 'contexto A' },
      { role: 'assistant', text: 'medido B' }
    ] as const
    const p = promptCto(hilo, 'arma el PASO')
    expect(p).toContain('Operador: contexto A')
    expect(p).toContain('Tu: medido B')
    expect(p.endsWith('Operador: arma el PASO')).toBe(true)
  })

  it('sin hilo: la consigna, la pregunta y nada mas', () => {
    const p = promptCto([], 'hola')
    expect(p.startsWith(CONSIGNA_CTO)).toBe(true)
    expect(p).not.toContain('La conversacion hasta ahora')
  })
})
