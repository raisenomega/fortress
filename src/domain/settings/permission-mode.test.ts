import { describe, expect, it } from 'vitest'
import { claudeModeArg, permissionModeFor } from './permission-mode'

/**
 * CONTRATO CORREGIDO (2026-09-20). Este test se llamaba «en supervisado el
 * agente no puede escribir» y afirmaba `'plan'`. El nombre prometia un
 * COMPORTAMIENTO y la asercion miraba una CADENA — y resulto que `plan` nunca
 * fue lo que impedia escribir: lo impiden `Write`/`Edit` al pedir permiso, que
 * en headless no hay quien conceda (medido el 2026-09-20, con su fila en
 * `permission_denials` y el fichero ausente del disco).
 *
 * Lo que `plan` SI hacia era matar el MCP, y por eso el supervisado no veia el
 * grafo. Ahora va a 'auditoria': misma imposibilidad de escribir, con grafo.
 */
describe('permissionModeFor', () => {
  it('supervisado va a auditoria: ve el grafo y sigue sin poder editar', () => {
    expect(permissionModeFor('supervisado')).toBe('auditoria')
  })

  it('y NUNCA a acceptEdits, que es lo unico que concede editar', () => {
    // La garantia del interruptor, dicha por lo que niega y no por un nombre.
    expect(permissionModeFor('supervisado')).not.toBe('acceptEdits')
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
