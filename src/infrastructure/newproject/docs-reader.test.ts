import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { readProjectDoc } from './docs-reader'

/**
 * Proyecto REAL en disco: un doc propio, un enlace que sale fuera (a las
 * credenciales del operador), un enlace interno legitimo y un atajo a la raiz.
 */
function seedProject(): { base: string; project: string } {
  const base = mkdtempSync(join(tmpdir(), 'fcc-docs-'))
  const project = join(base, 'proyecto')
  mkdirSync(project)
  writeFileSync(join(project, 'README.md'), 'doc del proyecto\n')
  writeFileSync(join(base, 'credenciales.txt'), 'SECRETO DEL OPERADOR\n')
  symlinkSync(join(base, 'credenciales.txt'), join(project, 'POLICY.md'))
  symlinkSync(join(project, 'README.md'), join(project, 'ALIAS.md'))
  symlinkSync(project, join(base, 'atajo'))
  return { base, project }
}

describe('readProjectDoc (guard de ruta)', () => {
  it('rechaza traversal y nombres con separadores', () => {
    expect(readProjectDoc('/tmp/p', '../../etc/passwd').ok).toBe(false)
    expect(readProjectDoc('/tmp/p', 'sub/x.md').ok).toBe(false)
    expect(readProjectDoc('/tmp/p', '..\\x.md').ok).toBe(false)
  })

  it('rechaza lo que no sea .md', () => {
    expect(readProjectDoc('/tmp/p', 'secrets.json').ok).toBe(false)
    expect(readProjectDoc('/tmp/p', '.env').ok).toBe(false)
  })

  it('lee un .md regular de la raiz', () => {
    const { project } = seedProject()
    const result = readProjectDoc(project, 'README.md')
    expect(result).toEqual({ ok: true, value: 'doc del proyecto\n' })
  })

  it('rechaza un .md de nombre plano que es enlace a un archivo de FUERA', () => {
    const { project } = seedProject()
    const result = readProjectDoc(project, 'POLICY.md')
    expect(result.ok).toBe(false)
    expect(JSON.stringify(result)).not.toContain('SECRETO')
  })

  it('admite un enlace que apunta DENTRO del mismo proyecto', () => {
    const { project } = seedProject()
    expect(readProjectDoc(project, 'ALIAS.md')).toEqual({ ok: true, value: 'doc del proyecto\n' })
  })

  it('la raiz del proyecto puede ser ella misma un enlace', () => {
    const { base } = seedProject()
    const porAtajo = join(base, 'atajo')
    expect(readProjectDoc(porAtajo, 'README.md')).toEqual({ ok: true, value: 'doc del proyecto\n' })
    expect(readProjectDoc(porAtajo, 'POLICY.md').ok).toBe(false)
  })

  it('documento ausente: error controlado, sin excepcion', () => {
    const { project } = seedProject()
    expect(readProjectDoc(project, 'NO-EXISTE.md')).toEqual({
      ok: false,
      error: 'No se pudo leer el documento'
    })
  })
})
