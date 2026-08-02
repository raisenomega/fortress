import { describe, expect, it } from 'vitest'
import { analyzeHeaders } from './headers'

describe('analyzeHeaders', () => {
  it('senala cada cabecera de seguridad que falta', () => {
    const findings = analyzeHeaders({})
    const titulos = findings.map((f) => f.title)
    expect(titulos).toContain('Sin HSTS')
    expect(titulos).toContain('Sin Content-Security-Policy')
  })

  it('un sitio bien puesto no genera hallazgos de cabecera faltante', () => {
    const findings = analyzeHeaders({
      'strict-transport-security': 'max-age=63072000',
      'content-security-policy': "default-src 'self'",
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin'
    })
    expect(findings.filter((f) => f.title.startsWith('Sin'))).toEqual([])
  })

  it('avisa de las cabeceras que filtran la version del servidor', () => {
    const findings = analyzeHeaders({ server: 'nginx/1.18.0', 'x-powered-by': 'PHP/7.4' })
    const fugas = findings.filter((f) => f.title.startsWith('Revela'))
    expect(fugas).toHaveLength(2)
    expect(fugas[0].evidence).toContain('nginx/1.18.0')
  })
})
