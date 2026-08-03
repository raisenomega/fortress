import { describe, expect, it } from 'vitest'
import { safeCommandRules } from './safe-commands'

describe('safeCommandRules', () => {
  it('permite verificar: tipos, lint y tests unitarios', () => {
    const rules = safeCommandRules()
    expect(rules).toContain('Bash(npm run typecheck)')
    expect(rules).toContain('Bash(npm run lint)')
    expect(rules).toContain('Bash(npm run test:unit)')
  })

  it('son solo esos tres: nada de correr cualquier cosa', () => {
    expect(safeCommandRules()).toHaveLength(3)
  })

  it('no usa comodines: cada regla es un comando exacto', () => {
    // Un comodin dejaria colar "npm run test:unit && rm -rf"; los exactos no.
    expect(safeCommandRules().every((rule) => !rule.includes('*'))).toBe(true)
  })

  it('nunca incluye el pase libre a la terminal', () => {
    expect(safeCommandRules().some((rule) => rule.includes('rm') || rule === 'Bash')).toBe(false)
  })
})
