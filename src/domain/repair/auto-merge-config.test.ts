import { describe, expect, it } from 'vitest'
import { AUTONOMY_RULES_FILES, COMMON_SENSITIVE_AREAS } from './auto-merge-blacklist'
import { parseAutoMergeConfig } from './auto-merge-config'
import type { AutoMergePolicy } from './auto-merge-policy'

const json = (autoMerge: unknown): string => JSON.stringify({ autoMerge })

/** La politica de un texto valido; falla el test si no lo era. */
function policyDe(texto: string): AutoMergePolicy {
  const estado = parseAutoMergeConfig(texto)
  if (estado.kind !== 'valid') throw new Error(`esperaba valid, llego ${estado.kind}`)
  return estado.policy
}

describe('parseAutoMergeConfig: los tres estados', () => {
  it('un bloque vacio hereda todos los defaults', () => {
    const estado = parseAutoMergeConfig(json({}))
    expect(estado.kind).toBe('valid')
  })

  it('JSON corrupto invalida, no rompe', () => {
    const estado = parseAutoMergeConfig('{ esto no es json')
    expect(estado).toEqual({ kind: 'invalid', reason: 'no es JSON valido' })
  })

  it('sin bloque autoMerge invalida con motivo legible', () => {
    const estado = parseAutoMergeConfig(JSON.stringify({ otraCosa: 1 }))
    expect(estado.kind).toBe('invalid')
  })

  it('un campo PRESENTE y mal formado invalida el archivo entero', () => {
    expect(parseAutoMergeConfig(json({ maxFiles: -1 })).kind).toBe('invalid')
    expect(parseAutoMergeConfig(json({ maxDiffLines: 'veinte' })).kind).toBe('invalid')
    expect(parseAutoMergeConfig(json({ severities: ['INVENTADA'] })).kind).toBe('invalid')
    expect(parseAutoMergeConfig(json({ blacklist: [42] })).kind).toBe('invalid')
  })

  it('los campos declarados mandan sobre el default', () => {
    const p = policyDe(json({ maxFiles: 2, maxDiffLines: 8, severities: ['LOW'] })) // prettier-ignore
    expect(p.maxFiles).toBe(2)
    expect(p.maxDiffLines).toBe(8)
    expect(p.severities).toEqual(['LOW'])
  })
})

describe('parseAutoMergeConfig: la asimetria del principio 21', () => {
  it('la lista del proyecto se ANADE, no reemplaza a la de autonomia', () => {
    const p = policyDe(json({ blacklist: ['src/mio/**'] }))
    expect(p.blacklist).toContain('src/mio/**')
    for (const file of AUTONOMY_RULES_FILES) expect(p.blacklist).toContain(file)
  })

  it('una lista VACIA no desprotege nada: la de autonomia sigue entera', () => {
    const p = policyDe(json({ blacklist: [] }))
    expect(p.blacklist).toEqual([...AUTONOMY_RULES_FILES])
    expect(p.blacklist).toContain('.fortress/config')
  })

  it('declarar lista propia SI sustituye a las areas sensibles por defecto', () => {
    const p = policyDe(json({ blacklist: ['src/mio/**'] }))
    for (const area of COMMON_SENSITIVE_AREAS) expect(p.blacklist).not.toContain(area)
  })

  it('sin declarar lista, se heredan las areas sensibles por defecto', () => {
    const p = policyDe(json({}))
    for (const area of COMMON_SENSITIVE_AREAS) expect(p.blacklist).toContain(area)
  })
})
