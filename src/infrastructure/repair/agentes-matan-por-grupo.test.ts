import { spawn } from 'child_process'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { killAllChildren, matarYaATodos, trackChild } from '../claude-code/child-registry'

/** Padre que deja un NIETO dormido (el modelo de claude + su proxy socat): matar
 *  al lider a secas lo deja huerfano pero vivo. Igual que matar-grupos.test. */
function conNieto(dir: string): string {
  const bin = join(dir, 'padre')
  writeFileSync(bin, `#!/bin/sh\nsleep 30 &\necho $! > ${dir}/nieto\nwait\n`)
  chmodSync(bin, 0o755)
  return bin
}
const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
const nietoVivo = (dir: string): boolean => {
  try {
    return process.kill(Number(readFileSync(join(dir, 'nieto'), 'utf8').trim()), 0)
  } catch {
    return false
  }
}
const fuente = (f: string): string => readFileSync(f, 'utf8')

afterEach(() => killAllChildren())

describe('el APAGADO headless se lleva el subarbol del agente (nieto socat incluido)', () => {
  it('matarYaATodos por GRUPO mata al nieto; el fix del analista/generador es esto', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fcc-agente-'))
    const child = spawn(conNieto(dir), [], { cwd: dir, detached: true })
    trackChild(child, 'p1', 'grupo')
    await esperar(300)
    matarYaATodos()
    await esperar(400)
    // Mutante: quitar detached/'grupo' (como estaba) -> el nieto SOBREVIVE -> ROJO.
    expect(nietoVivo(dir)).toBe(false)
  }, 20_000)
})

describe('nunca-vuelve: los dos outliers usan el patron de grupo (como critico/omega)', () => {
  it.each(['graph-analyst', 'graph-generator'])('%s spawnea detached y registra grupo', (mod) => {
    const src = fuente(`src/infrastructure/repair/${mod}.ts`)
    expect(src).toMatch(/detached:\s*true/)
    expect(src).toMatch(/trackChild\([^)]*'grupo'\)/)
  })
  it('el timeout-kill del generador tambien va por grupo (no deja escapar al nieto)', () => {
    expect(fuente('src/infrastructure/repair/graph-generator.ts')).toMatch(/senalAl\([^)]*'grupo'\)/)
  })
})
