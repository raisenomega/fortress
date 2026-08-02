import { describe, expect, it } from 'vitest'
import { analyzeExposed } from './exposed'

describe('analyzeExposed', () => {
  it('un .env accesible es CRITICAL', () => {
    const findings = analyzeExposed([{ path: '/.env', status: 200 }])
    expect(findings[0].severity).toBe('CRITICAL')
    expect(findings[0].evidence).toContain('200')
  })

  it('un 404 no es un hallazgo: la puerta esta cerrada', () => {
    expect(analyzeExposed([{ path: '/.env', status: 404 }])).toEqual([])
  })

  it('que security.txt exista NO es un problema, es una buena practica', () => {
    expect(analyzeExposed([{ path: '/.well-known/security.txt', status: 200 }])).toEqual([])
  })

  it('un backup accesible es HIGH, no CRITICAL', () => {
    expect(analyzeExposed([{ path: '/backup.zip', status: 200 }])[0].severity).toBe('HIGH')
  })
})
