import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { createReindexRunner } from './reindex-runner'

/** Binario fake: el runner solo mira exit code y salida. cwd es este repo (git real). */
function fakeBin(script: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-runner-'))
  const file = join(dir, 'fake-indexer')
  writeFileSync(file, `#!/bin/sh\n${script}\n`)
  chmodSync(file, 0o755)
  return file
}

describe('createReindexRunner', () => {
  it('exit 0 devuelve ok con el SHA leido ANTES de la corrida', async () => {
    const runner = createReindexRunner(fakeBin('cat > /dev/null; exit 0'))
    const result = await runner.run(process.cwd(), 'p1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.sha).toMatch(/^[0-9a-f]{40}$/)
  })

  it('exit != 0 devuelve error con la ultima linea significativa', async () => {
    const runner = createReindexRunner(fakeBin('cat > /dev/null; echo "fallo grave"; exit 3'))
    const result = await runner.run(process.cwd(), 'p1')
    expect(result).toEqual({ ok: false, error: 'fallo grave' })
  })

  it('el timeout mata el proceso y reporta error', async () => {
    const runner = createReindexRunner(fakeBin('cat > /dev/null; sleep 30'), 150)
    const result = await runner.run(process.cwd(), 'p1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/timeout/)
  })

  it('binario inexistente: error claro, sin lanzar', async () => {
    const runner = createReindexRunner('/no/existe/indexer')
    const result = await runner.run(process.cwd(), 'p1')
    expect(result).toEqual({ ok: false, error: 'binary not found: /no/existe/indexer' })
  })

  it('carpeta sin repo git: error sin spawnear nada', async () => {
    const runner = createReindexRunner(fakeBin('exit 0'))
    const result = await runner.run(tmpdir(), 'p1')
    expect(result).toEqual({ ok: false, error: 'sin repo git' })
  })
})
