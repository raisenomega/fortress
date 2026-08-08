import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readOnly } from './read-only-guard'

describe('readOnly (guard de 4 capas)', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ro-'))
    writeFileSync(join(dir, 'source.ts'), 'const a = 1')
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('borra archivos NUEVOS y sus carpetas (tsbuildinfo, dist) -> integridad limpia', async () => {
    const { integrity } = await readOnly(dir, async () => {
      writeFileSync(join(dir, 'x.tsbuildinfo'), '{}')
      mkdirSync(join(dir, 'dist'))
      writeFileSync(join(dir, 'dist', 'bundle.js'), 'x')
    })
    expect(existsSync(join(dir, 'x.tsbuildinfo'))).toBe(false)
    expect(existsSync(join(dir, 'dist'))).toBe(false)
    expect(integrity.clean).toBe(true)
  })

  it('CAPA 2: RESTAURA un archivo trackeado modificado (caso inject-sw-version)', async () => {
    const { integrity } = await readOnly(dir, async () => {
      writeFileSync(join(dir, 'source.ts'), 'const a = 999 // reescrito por un prebuild')
    })
    // Capa 2 lo dejo como estaba; Capa 3 lo confirma.
    expect(readFileSync(join(dir, 'source.ts'), 'utf8')).toBe('const a = 1')
    expect(integrity.clean).toBe(true)
  })

  it('restaura incluso si el trabajo LANZA (limpieza en finally) y re-lanza', async () => {
    await expect(
      readOnly(dir, async () => {
        writeFileSync(join(dir, 'source.ts'), 'cambiado a medias')
        throw new Error('probe fallo')
      })
    ).rejects.toThrow('probe fallo')
    expect(readFileSync(join(dir, 'source.ts'), 'utf8')).toBe('const a = 1')
  })
})
