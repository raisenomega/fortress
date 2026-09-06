import { mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { writeScan } from '../cognition/write-cognition-log'
import { rutaContenida } from './ruta-contenida'

const tmp = (p: string): string => mkdtempSync(join(tmpdir(), p))

const escaneo = (projectPath: string): Parameters<typeof writeScan>[0] => ({
  projectPath,
  projectName: 'P',
  findings: [],
  resolved: [],
  score: 100,
  counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
  at: '2026-09-06T00:00:00Z'
})

describe('el ataque real: un enlace commiteado en el repo auditado', () => {
  it('COGNITION-LOG.md que apunta FUERA no se sobrescribe', () => {
    const victima = join(tmp('fcc-victima-'), 'claves.txt')
    writeFileSync(victima, 'SECRETO DEL OPERADOR')
    const repo = tmp('fcc-repo-')
    symlinkSync(victima, join(repo, 'COGNITION-LOG.md'))

    writeScan(escaneo(repo))

    expect(readFileSync(victima, 'utf8')).toBe('SECRETO DEL OPERADOR')
  })

  it('y en un repo normal se escribe, como siempre', () => {
    const repo = tmp('fcc-repo-')

    writeScan(escaneo(repo))

    expect(readFileSync(join(repo, 'COGNITION-LOG.md'), 'utf8')).toContain('P')
  })
})

describe('rutaContenida', () => {
  it('el fichero que AUN NO existe se resuelve por su carpeta', () => {
    const repo = tmp('fcc-r-')
    expect(rutaContenida(repo, 'nuevo.md')).toBe(join(repo, 'nuevo.md'))
  })

  it('una CARPETA enlazada fuera tambien escapa, no solo el fichero', () => {
    const fuera = tmp('fcc-fuera-')
    const repo = tmp('fcc-r-')
    symlinkSync(fuera, join(repo, 'docs'))

    expect(rutaContenida(repo, 'docs/x.md')).toBeNull()
  })

  it('la raiz que es a su vez un enlace NO da fuga falsa', () => {
    // Comparar la ruta real contra la nominal marcaria como fuera todo proyecto
    // que viva bajo un enlace. Por eso se resuelven las dos puntas.
    const real = tmp('fcc-real-')
    mkdirSync(join(real, 'sub'))
    const alias = join(tmp('fcc-alias-'), 'proyecto')
    symlinkSync(real, alias)

    expect(rutaContenida(alias, 'sub/a.md')).toBe(join(real, 'sub', 'a.md'))
  })

  it('un `..` sale, y una raiz que no existe no se puede probar', () => {
    const repo = tmp('fcc-r-')
    expect(rutaContenida(repo, '../fuera.md')).toBeNull()
    expect(rutaContenida(join(repo, 'no-existe'), 'a.md')).toBeNull()
  })
})
