import { describe, expect, it } from 'vitest'
import { isSeverity } from '../shared/severity'
import { severidadDelInforme } from './severidad-del-informe'

describe('severidadDelInforme', () => {
  it('lleva a la escala lo que el modelo escribe en minuscula', () => {
    expect(severidadDelInforme('critical')).toBe('CRITICAL')
    expect(severidadDelInforme('high')).toBe('HIGH')
    expect(severidadDelInforme('medium')).toBe('MEDIUM')
    expect(severidadDelInforme('low')).toBe('LOW')
  })

  it('tolera la capitalizacion y los espacios de alrededor', () => {
    expect(severidadDelInforme('Critical')).toBe('CRITICAL')
    expect(severidadDelInforme('  High  ')).toBe('HIGH')
  })

  it('NO adivina: una palabra fuera de la escala sigue siendo nula', () => {
    expect(severidadDelInforme('URGENTE')).toBeNull()
    expect(severidadDelInforme('urgente')).toBeNull()
    expect(severidadDelInforme('')).toBeNull()
    expect(severidadDelInforme(3)).toBeNull()
    expect(severidadDelInforme(null)).toBeNull()
  })

  it('el guard de la BASE sigue estricto: las dos puertas no son iguales', () => {
    // Asimetria deliberada. Aqui se lee a un LLM y `high` es un hallazgo real;
    // en una fila de la base `high` seria corrupcion y tiene que chirriar.
    expect(isSeverity('high')).toBe(false)
    expect(isSeverity('High')).toBe(false)
    expect(isSeverity('HIGH')).toBe(true)
  })
})
