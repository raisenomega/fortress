import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readOnly } from './read-only-guard'

describe('readOnly', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ro-'))
    writeFileSync(join(dir, 'source.ts'), 'const a = 1')
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('borra los archivos y carpetas NUEVOS que deja el trabajo (tsbuildinfo, dist)', async () => {
    await readOnly(dir, async () => {
      writeFileSync(join(dir, 'x.tsbuildinfo'), '{}')
      mkdirSync(join(dir, 'dist'))
      writeFileSync(join(dir, 'dist', 'bundle.js'), 'x')
    })
    expect(existsSync(join(dir, 'x.tsbuildinfo'))).toBe(false)
    expect(existsSync(join(dir, 'dist'))).toBe(false)
  })

  it('NO toca lo que ya existia: la fuente queda byte-identica', async () => {
    await readOnly(dir, async () => writeFileSync(join(dir, 'nuevo.txt'), 'z'))
    expect(existsSync(join(dir, 'source.ts'))).toBe(true)
    expect(readFileSync(join(dir, 'source.ts'), 'utf8')).toBe('const a = 1')
  })

  it('devuelve el valor del trabajo y limpia aun si lanza', async () => {
    expect(await readOnly(dir, async () => 42)).toBe(42)
    await expect(
      readOnly(dir, async () => {
        writeFileSync(join(dir, 'temp.log'), 'x')
        throw new Error('probe fallo')
      })
    ).rejects.toThrow('probe fallo')
    expect(existsSync(join(dir, 'temp.log'))).toBe(false)
  })
})
