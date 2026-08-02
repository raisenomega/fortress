import { describe, expect, it } from 'vitest'
import { permissionModeFor } from './permission-mode'

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
