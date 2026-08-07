import { describe, expect, it } from 'vitest'
import { claudeModeArg, permissionModeFor } from './permission-mode'

describe('permissionModeFor', () => {
  it('en supervisado el agente no puede escribir', () => {
    expect(permissionModeFor('supervisado')).toBe('plan')
  })

  it('en autonomo puede editar archivos', () => {
    expect(permissionModeFor('autonomo')).toBe('acceptEdits')
  })

  it('nunca concede bypassPermissions', () => {
    const modos = (['supervisado', 'autonomo'] as const).map(permissionModeFor)
    expect(modos).not.toContain('bypassPermissions')
  })
})

describe('claudeModeArg', () => {
  it("'lectura' corre en 'default' (plan bloquea todo el MCP)", () => {
    expect(claudeModeArg('lectura')).toBe('default')
  })

  it('plan y acceptEdits pasan tal cual', () => {
    expect(claudeModeArg('plan')).toBe('plan')
    expect(claudeModeArg('acceptEdits')).toBe('acceptEdits')
  })
})
