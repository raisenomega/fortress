import { describe, expect, it } from 'vitest'
import { analyzeDefenses } from './defenses'

describe('analyzeDefenses', () => {
  it('sin WAF ni rate limiting, avisa de la exposicion a inundacion', () => {
    const findings = analyzeDefenses({ server: 'nginx' })
    expect(findings[0].title).toContain('inundacion')
  })

  it('detras de un CDN no molesta: la defensa esta puesta', () => {
    expect(analyzeDefenses({ 'cf-ray': 'abc123' })).toEqual([])
  })

  it('con rate limiting a la vista tampoco avisa', () => {
    expect(analyzeDefenses({ 'x-ratelimit-limit': '100' })).toEqual([])
  })
})
