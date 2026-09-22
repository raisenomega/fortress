import { describe, expect, it } from 'vitest'
import { BLOQUE_DE_TIPOS } from './bloque-de-tipos'
import { DEFECTOS_DE_AUDITORIA } from './defectos-de-auditoria'
import { DEFECTOS_DE_CASA } from './defectos-de-casa'
import { DEFECTOS_DE_CODIGO_AJENO } from './defectos-de-codigo-ajeno'
import { DESEMPATES } from './desempate-de-tipos'
import { REPORT_CONTRACT } from './report-contract'
import { aTipoDeDefecto, DEFECTOS, TIPOS_DE_DEFECTO } from './tipo-de-defecto'

/** Los seis de ADR-100, con su nombre tal cual lo firmo el operador. */
// prettier-ignore
const SEIS = ['accesibilidad', 'privacidad', 'integridad-de-negocio', 'continuidad-y-backups', 'dependencia-vulnerable', 'criptografia-debil'] as const

describe('la tercera lista: los tipos de auditoria (ADR-100)', () => {
  it('trae exactamente los seis, cada uno con su definicion de una linea', () => {
    expect(Object.keys(DEFECTOS_DE_AUDITORIA)).toEqual([...SEIS])
    for (const tipo of SEIS) expect(DEFECTOS_DE_AUDITORIA[tipo].length).toBeGreaterThan(20)
  })

  it('el vocabulario los une detras de los ajenos y delante de otro, y el parser los acepta', () => {
    const i = SEIS.map((t) => TIPOS_DE_DEFECTO.indexOf(t))
    expect(Math.min(...i)).toBeGreaterThan(TIPOS_DE_DEFECTO.indexOf('identificador-predecible'))
    expect(Math.max(...i)).toBeLessThan(TIPOS_DE_DEFECTO.indexOf('otro'))
    for (const t of SEIS) expect(aTipoDeDefecto(t)).toBe(t)
  })

  it('el contrato del escaner enumera los seis con su definicion: uno que falte no se podria elegir', () => {
    for (const t of SEIS) expect(REPORT_CONTRACT).toContain(`${t}: ${DEFECTOS[t]}`)
    for (const t of SEIS) expect(BLOQUE_DE_TIPOS).toContain(`  · ${t}: `)
  })

  it('los 27 de seguridad siguen intactos: 15 de casa, 11 ajenos y otro al final', () => {
    expect(Object.keys(DEFECTOS_DE_CASA)).toHaveLength(15)
    expect(Object.keys(DEFECTOS_DE_CODIGO_AJENO)).toHaveLength(11)
    expect(TIPOS_DE_DEFECTO).toHaveLength(15 + 11 + 6 + 1)
    expect(TIPOS_DE_DEFECTO.at(-1)).toBe('otro')
  })
})

describe('los desempates de ADR-100 mandan al tipo firmado', () => {
  it('dato personal de un titular -> privacidad; un secreto del sistema -> secreto-sin-redactar', () => {
    const regla = DESEMPATES.find((r) => r.startsWith('Dato personal de un titular')) ?? ''
    expect(regla).toMatch(/^Dato personal de un titular -> privacidad\./)
    expect(regla).toContain('-> secreto-sin-redactar')
    expect(BLOQUE_DE_TIPOS).toContain(regla)
  })

  it('el cliente manda el dato -> confianza-en-datos-del-cliente; el sistema se contradice -> integridad-de-negocio', () => {
    const regla = DESEMPATES.find((r) => r.includes('se contradice a si mismo')) ?? ''
    expect(regla).toMatch(/^El dato lo manda el cliente[^.]* -> confianza-en-datos-del-cliente\./)
    expect(regla).toMatch(/se contradice a si mismo[^.]* -> integridad-de-negocio\./)
  })
})
