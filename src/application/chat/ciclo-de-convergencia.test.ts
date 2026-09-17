import { describe, expect, it } from 'vitest'
import type { VeredictoDelTurno } from '@domain/chat/veredicto-del-turno'
import { hastaConverger } from './ciclo-de-convergencia'
import { APRUEBA, FOCO, juezDeMentira, productorDeMentira, redDeMentira, VETA } from './ciclo-de-convergencia-fixture' // prettier-ignore

interface Corrida {
  readonly red: ReturnType<typeof redDeMentira>
  readonly p: ReturnType<typeof productorDeMentira>
  readonly ciclo: ReturnType<typeof hastaConverger>
}

/** Un ciclo entero con el guion de veredictos que se le quiera dar a OMEGA. */
function correr(guion: readonly VeredictoDelTurno[], ses = ['s1', 's2']): Corrida {
  const red = redDeMentira()
  const p = productorDeMentira(ses)
  const juez = juezDeMentira(guion)
  return { red, p, ciclo: hastaConverger({ red, cwd: '/p', foco: FOCO, pedido: 'arregla la CSP', juez, producir: p.producir }) } // prettier-ignore
}

/**
 * ADR-090, Fase A. El turno autonomo no para a preguntar: si OMEGA veta, el
 * productor vuelve a intentarlo con la objecion delante, y asi hasta que el
 * trabajo converge o deja de avanzar. En ningun ramal se llama al humano.
 */
describe('el turno autonomo juzga y reintenta hasta converger', () => {
  it('APROBADO al primer intento: se conserva y no se reintenta', async () => {
    const { red, p, ciclo } = correr([APRUEBA])
    const r = await ciclo

    expect(r.convergio).toBe(true)
    expect(r.intentos).toBe(1)
    expect(red.pasos).toEqual(['conservar'])
    expect(p.intentos).toHaveLength(0)
  })

  it('VETADO: REVIERTE y reintenta con el veto y la sesion del intento anterior', async () => {
    const { red, p, ciclo } = correr([VETA('h1'), APRUEBA])
    const r = await ciclo

    expect(r.convergio).toBe(true)
    expect(r.intentos).toBe(2)
    // Primero deshizo lo vetado, y solo despues conservo lo bueno.
    expect(red.pasos).toEqual(['revertir', 'conservar'])
    // El reintento reanuda la sesion QUE DEVOLVIO el intento 1 (`--resume`).
    expect(p.intentos[0].sesion).toBe('s1')
    expect(p.intentos[0].pedido).toContain('VETADO')
    expect(p.intentos[0].pedido).toContain('la CSP sigue permitiendo inline')
  })

  it('el reintento repite el MISMO diff: no avanza, se cierra sin resolver', async () => {
    // Misma huella dos veces = el productor da vueltas. No es un contador: es
    // que no hay progreso que esperar.
    const { red, ciclo } = correr([VETA('h1'), VETA('h1', 'sigue igual')])
    const r = await ciclo

    expect(r.convergio).toBe(false)
    expect(r.razon).toBe('sigue igual')
    expect(r.intentos).toBe(2)
    expect(red.pasos).toEqual(['revertir', 'revertir'])
  })

  it('mientras el diff CAMBIE se sigue: tres intentos distintos y converge', async () => {
    const { red, ciclo } = correr([VETA('h1'), VETA('h2'), APRUEBA])
    const r = await ciclo

    expect(r.intentos).toBe(3)
    expect(r.convergio).toBe(true)
    expect(red.pasos).toEqual(['revertir', 'revertir', 'conservar'])
  })
})
