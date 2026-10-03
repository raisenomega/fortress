import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { parseAutoMergeConfig } from '@domain/repair/auto-merge-config'
import { allowsFor, checkScope } from '@domain/repair/scope-check'
import { FORTRESS_CONFIG, readScopeGroups } from './fortress-config'

/**
 * ADR-111, pieza 1: el grupo de la correa de dependencias esta DECLARADO en el
 * `.fortress/config` de ESTE repo, y hace lo que la firma dice. El test lee el
 * archivo real —no una copia—: si el grupo se borra, se tuerce o deja de
 * parsear (el mutante `allow: ['**']` tira la lista ENTERA a la correa
 * universal), esto cae.
 */
const grupos = readScopeGroups(process.cwd())

describe('el grupo de la correa de dependencias (ADR-111)', () => {
  it('esta declarado y parseScopeGroups lo acepta tal cual', () => {
    expect(grupos).toEqual([
      { name: 'correa-de-dependencias', when: 'package.json', allow: ['package-lock.json'] }
    ])
  })

  it('un hallazgo anclado en package.json puede tocar el lock', () => {
    const allows = allowsFor('package.json', grupos)
    const scope = checkScope(['package.json', 'package-lock.json'], ['package.json'], allows)
    expect(scope).toEqual({ ok: true, violations: [] })
  })

  it('es DIRIGIDO: otro ancla no abre el lock, y el lock no abre package.json', () => {
    expect(allowsFor('src/domain/repair/scope-check.ts', grupos)).toEqual([])
    const ajeno = checkScope(['package-lock.json'], ['src/a.ts'], allowsFor('src/a.ts', grupos))
    expect(ajeno).toEqual({ ok: false, violations: ['package-lock.json'] })
    // El grupo no es simetrico: el lock como ancla no activa nada.
    expect(allowsFor('package-lock.json', grupos)).toEqual([])
  })

  it('el lock NUNCA se auto-mergea: sigue en la blacklist y el config sigue valido', () => {
    const estado = parseAutoMergeConfig(readFileSync(join(process.cwd(), FORTRESS_CONFIG), 'utf8'))
    if (estado.kind !== 'valid') throw new Error(`config ${estado.kind}`)
    expect(estado.policy.blacklist).toContain('package.json')
    expect(estado.policy.blacklist).toContain('package-lock.json')
  })
})
