import { describe, expect, it } from 'vitest'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'
import { buildArgs } from './claude-cli'

const args = (mode: ClaudePermissionMode): readonly string[] => buildArgs('hola', mode, {}, null, 3).args
/** El valor que sigue a un flag, o null si el flag no va. */
const tras = (lista: readonly string[], flag: string): string | null => {
  const i = lista.indexOf(flag)
  return i === -1 ? null : (lista[i + 1] ?? null)
}

/**
 * `--allowedTools` PRE-APRUEBA; no deniega. Medido el 2026-09-20 con
 * `--permission-mode default --allowedTools Read`: Bash se ejecuto igual y
 * `permission_denials` salio VACIO. El docblock del repo afirmaba lo contrario
 * y todo el que lo leyo lo creyo.
 *
 * Impedir una herramienta pide `--disallowedTools`, y eso tambien se midio: con
 * el, el agente contesta «NO_PUDE_BASH» — y `permission_denials` sigue vacio,
 * porque la herramienta NO SE LE OFRECE en vez de denegarsele la llamada.
 */
describe('lo que de verdad se le quita al agente', () => {
  it('lectura sale con --disallowedTools Bash', () => {
    expect(tras(args('lectura'), '--disallowedTools')).toBe('Bash')
  })

  it('auditoria NO lo lleva: el escaner vive de ejecutar', () => {
    expect(args('auditoria')).not.toContain('--disallowedTools')
  })

  it('ni plan ni acceptEdits: el flag solo aparece donde hace falta', () => {
    for (const modo of ['plan', 'acceptEdits'] as const) {
      expect(args(modo)).not.toContain('--disallowedTools')
    }
  })
})

describe('las dos listas son cosas distintas, y se ven en los args', () => {
  it('lectura OMITE Bash del allowlist Y ademas lo quita', () => {
    // Omitirlo nunca basto: ahi estuvo el agujero durante meses.
    const l = args('lectura')

    expect(l.slice(l.indexOf('--allowedTools'), l.indexOf('--disallowedTools'))).not.toContain('Bash') // prettier-ignore
    expect(tras(l, '--disallowedTools')).toBe('Bash')
  })

  it('auditoria lo LISTA, que es pre-aprobarlo, y no lo quita', () => {
    expect(args('auditoria')).toContain('Bash')
    expect(args('auditoria')).not.toContain('--disallowedTools')
  })
})
