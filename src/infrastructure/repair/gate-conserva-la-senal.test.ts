import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { killChildrenOf } from '../claude-code/child-registry'
import { spawnCommand } from './spawn-command'

/**
 * El camino MEDIDO el 2026-10-05 (36d0061a): Detener → cancelRun →
 * killChildrenOf(proyecto) mata a los hijos del gate, que van registrados con el
 * proyecto como dueno. El cierre llegaba con code=null y se apuntaba `code ?? 1`:
 * un lint muerto quedaba como un lint rojo, y la senal se perdia.
 */
function lento(): string {
  const bin = join(mkdtempSync(join(tmpdir(), 'fcc-lento-')), 'lento')
  writeFileSync(bin, '#!/bin/sh\necho "> eslint ."\nsleep 20\n')
  chmodSync(bin, 0o755)
  return bin
}

describe('un comando del gate matado conserva su senal', () => {
  it('Detener (killChildrenOf del proyecto) → la senal queda escrita, no un exit 1 a secas', async () => {
    const corriendo = spawnCommand(lento(), 'lint', [], tmpdir(), 30_000, 'proj-senal')
    await new Promise((r) => setTimeout(r, 400))
    killChildrenOf('proj-senal')
    const r = await corriendo
    expect(r.senal).toBe('SIGTERM')
    expect(r.timedOut).toBe(false)
  })

  it('un exit 1 de verdad no trae senal', async () => {
    const bin = join(mkdtempSync(join(tmpdir(), 'fcc-uno-')), 'uno')
    writeFileSync(bin, '#!/bin/sh\nexit 1\n')
    chmodSync(bin, 0o755)
    const r = await spawnCommand(bin, 'lint', [], tmpdir(), 10_000, 'proj-uno')
    expect(r.exitCode).toBe(1)
    expect(r.senal).toBeUndefined()
  })
})
