import { describe, expect, it } from 'vitest'
import { agentesDelTurno } from './agentes-del-turno'

/**
 * ADR-097. El numero que la barra enseña. El ensayo del 18-sep corrio TRES
 * agentes y la barra dijo uno: este es el dato que faltaba.
 */
describe('cuantos agentes intervienen en un turno', () => {
  it('sin juicio: solo el productor', () => {
    // Supervisado, o sin foco, o sin red. Nadie mas participa.
    expect(agentesDelTurno(false, false)).toBe(1)
  })

  it('con juicio y sin critico: productor y OMEGA — la Fase A', () => {
    expect(agentesDelTurno(true, false)).toBe(2)
  })

  it('con juicio y con critico: los TRES — lo que corrio en el ensayo', () => {
    expect(agentesDelTurno(true, true)).toBe(3)
  })

  it('sin juicio el critico no cuenta aunque este inyectado', () => {
    // El tribunal vive detras de la guarda de `arbitrar`: sin juicio no corre,
    // asi que anunciarlo seria prometer un debate que no va a ocurrir.
    expect(agentesDelTurno(false, true)).toBe(1)
  })

  it('nunca menos de uno: el productor no es opcional', () => {
    const todos = [agentesDelTurno(false, false), agentesDelTurno(true, false), agentesDelTurno(true, true)] // prettier-ignore
    expect(Math.min(...todos)).toBe(1)
  })
})
