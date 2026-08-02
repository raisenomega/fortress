import { describe, expect, it } from 'vitest'
import type { Target } from '@domain/posture/target-url'
import { buildFindings, type Signals } from './build-findings'

const target: Target = { url: 'https://midominio.com', host: 'midominio.com', https: true }

const signals = (over: Partial<Signals['root']> = {}): Signals => ({
  root: { status: 200, headers: {}, setCookies: [], body: '', ...over },
  redirectsToHttps: true,
  paths: [{ path: '/.env', status: 200 }]
})

describe('buildFindings segun profundidad', () => {
  it('baja solo mira cabeceras y TLS, no rutas expuestas', () => {
    const findings = buildFindings(target, ['headers', 'tls'], signals())
    expect(findings.some((f) => f.family === 'exposed')).toBe(false)
    expect(findings.some((f) => f.family === 'headers')).toBe(true)
  })

  it('alta si mira las rutas: encuentra el .env abierto', () => {
    const findings = buildFindings(target, ['headers', 'tls', 'exposed'], signals())
    expect(findings.some((f) => f.severity === 'CRITICAL' && f.family === 'exposed')).toBe(true)
  })

  it('el CORS abierto solo se reporta si la familia entra', () => {
    const abierto = signals({ headers: { 'access-control-allow-origin': '*' } })
    expect(buildFindings(target, ['headers'], abierto).some((f) => f.family === 'cors')).toBe(false)
    expect(buildFindings(target, ['cors'], abierto).some((f) => f.family === 'cors')).toBe(true)
  })
})
