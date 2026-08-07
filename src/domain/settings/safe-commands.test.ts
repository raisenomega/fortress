import { describe, expect, it } from 'vitest'
import { safeCommandRules, selfVerifyRules } from './safe-commands'

describe('safeCommandRules', () => {
  it('se arma de los scripts reales del repo', () => {
    const rules = safeCommandRules(['typecheck', 'lint', 'test:unit', 'build'])
    expect(rules).toEqual([
      'Bash(npm run typecheck)',
      'Bash(npm run lint)',
      'Bash(npm run test:unit)'
    ])
  })

  it('coincide con otros nombres de script: type-check y test', () => {
    const rules = safeCommandRules(['type-check', 'test'])
    expect(rules).toContain('Bash(npm run type-check)')
    expect(rules).toContain('Bash(npm run test)')
  })

  it('prefiere test:unit sobre test cuando ambos existen', () => {
    const rules = safeCommandRules(['test', 'test:unit'])
    expect(rules).toContain('Bash(npm run test:unit)')
    expect(rules).not.toContain('Bash(npm run test)')
  })

  it('sin scripts que encajen, allowlist vacio; nunca comodines', () => {
    expect(safeCommandRules(['build', 'start'])).toEqual([])
    expect(safeCommandRules(['lint']).every((rule) => !rule.includes('*'))).toBe(true)
  })
})

describe('selfVerifyRules', () => {
  const scripts = ['typecheck', 'lint', 'test:unit']

  it('da el allowlist solo al editar (acceptEdits) en repo de confianza', () => {
    expect(selfVerifyRules('acceptEdits', true, scripts)).toEqual(safeCommandRules(scripts))
  })

  it('repo NO confiable: nada. `npm run X` es codigo del repo auditado', () => {
    expect(selfVerifyRules('acceptEdits', false, scripts)).toEqual([])
  })

  it('en plan: nada, aunque sea de confianza. Auditar/proponer no edita', () => {
    expect(selfVerifyRules('plan', true, scripts)).toEqual([])
    expect(selfVerifyRules('plan', false, scripts)).toEqual([])
  })
})
