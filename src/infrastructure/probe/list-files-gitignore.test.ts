import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listFiles } from './list-files'

/** PASO 172a (Capa 3): la foto de integridad vela la FUENTE, no los build-artifacts.
 *  Respeta .gitignore → `.next/` (regenerable) no entra, y no contamina en falso. */
let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'gi-172a-'))
  execFileSync('git', ['init'], { cwd: dir })
  writeFileSync(join(dir, '.gitignore'), '.next/\n')
  writeFileSync(join(dir, 'src.ts'), 'const a = 1')
  mkdirSync(join(dir, '.next'))
  writeFileSync(join(dir, '.next', 'build.js'), 'BUILD')
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('list-files respeta .gitignore', () => {
  it('incluye la FUENTE (src.ts) y excluye el build gitignored (.next/)', () => {
    const rels = listFiles(dir).map((f) => f.slice(dir.length + 1))
    expect(rels).toContain('src.ts')
    expect(rels.some((r) => r.startsWith('.next'))).toBe(false)
  })
})
