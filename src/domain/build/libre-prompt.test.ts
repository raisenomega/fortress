import { describe, expect, it } from 'vitest'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { promptLibre, type TurnoLibre } from './libre-prompt'

/** PASO 91: el modo LIBRE conversa sin repo. El prompt lleva la consigna
 *  powers-off (no hay proyecto: ni ficheros ni disco), el hilo y la pregunta. */
describe('el prompt del modo libre', () => {
  const hilo: readonly TurnoLibre[] = [
    { role: 'user', text: 'que es un bloom filter?' },
    { role: 'assistant', text: 'una estructura probabilistica...' }
  ]

  it('lleva la consigna sin-repo, el hilo en orden y la pregunta nueva al final', () => {
    const prompt = promptLibre(hilo, 'y cuando NO usarlo?')
    expect(prompt).toContain('No hay proyecto ni repo')
    expect(prompt.indexOf('bloom filter')).toBeLessThan(prompt.indexOf('probabilistica'))
    expect(prompt.trim().endsWith('y cuando NO usarlo?')).toBe(true)
  })

  it('sin hilo previo, es la pregunta con su consigna, sin transcript fantasma', () => {
    const prompt = promptLibre([], 'hola')
    expect(prompt).toContain('No hay proyecto ni repo')
    expect(prompt).not.toContain('Operador:\n')
    expect(prompt.trim().endsWith('hola')).toBe(true)
  })

  it('el rol libre existe en la escalera por alias: opus', () => {
    expect(MODELO_POR_ROL.libre).toBe('opus')
  })

  it('la consigna ANUNCIA WebSearch y ORDENA buscar lo actual (PASO 101)', () => {
    // El bug del smoke 100: el grant llegaba pero la consigna del 91 nunca le
    // dijo al modelo que tenia busqueda — respondia de memoria con su cutoff.
    const prompt = promptLibre([], 'que paso hoy?')
    expect(prompt).toContain('WebSearch')
    expect(prompt).toMatch(/[Bb]usca/)
  })
})
