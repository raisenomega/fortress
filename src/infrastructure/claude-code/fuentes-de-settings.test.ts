import { describe, expect, it } from 'vitest'
import { buildArgs } from './claude-cli'

/**
 * El CRITICAL 351abcd1, MEDIDO en vivo con el rig (2026-10-04): sin este flag,
 * el hook del `.claude/settings.json` del repo auditado DISPARO (fuera de la
 * caja: leyo el HOME y salio a la red) y su `apiKeyHelper` se ejecuto hasta
 * secuestrar la autenticacion de la corrida. Con `--setting-sources user`,
 * cero marcadores y la caja `--settings` siguio aplicando (capa aparte).
 */
const PAR = ['--setting-sources', 'user']

describe('las fuentes de settings segun la confianza', () => {
  it('sin confianza, SOLO las del operador: los settings del repo auditado no cargan', () => {
    const a = buildArgs('hola', 'auditoria', {}, null, 1).args
    expect(a[a.indexOf('--setting-sources') + 1]).toBe('user')
  })

  it('con confianza, las de proyecto cargan: el hook de ADR-098 vive ahi', () => {
    const args = buildArgs('hola', 'acceptEdits', {}, null, 1, null, true).args
    expect(args).not.toContain('--setting-sources')
  })

  it('la caja viaja APARTE de las fuentes: quitar las del repo no quita el sandbox', () => {
    // La corrida B del rig lo probo en vivo; esto lo clava en el contrato:
    // `--settings` (la caja, ADR-092) no es una "source" y sobrevive al flag.
    expect(PAR).not.toContain('--settings')
  })
})
