import { spawn } from 'child_process'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { killAllChildren, killChildrenOf, liveChildCount, trackChild } from './child-registry'
import type { ModoDeMuerte } from './kill-signal'

/**
 * Un padre que deja un NIETO dormido, con su pid escrito. Es el modelo de lo que
 * pasa de verdad: `claude` y el MCP, `npm` y `vitest`. Matar al lider a secas
 * deja al nieto huerfano pero vivo, y el nieto es quien sostiene las tuberias.
 *
 * Sin `trap` a proposito. Un shell que IGNORA una senal se la transmite ignorada
 * a lo que lance despues, asi que el nieto quedaba inmune al SIGTERM del grupo y
 * la prueba fallaba por el banco y no por el codigo.
 */
function conNieto(dir: string): string {
  const bin = join(dir, 'padre')
  writeFileSync(bin, `#!/bin/sh\nsleep 30 &\necho $! > ${dir}/nieto\nwait\n`)
  chmodSync(bin, 0o755)
  return bin
}

const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function nietoSigueVivo(dir: string): boolean {
  try {
    process.kill(Number(readFileSync(join(dir, 'nieto'), 'utf8').trim()), 0)
    return true
  } catch {
    return false
  }
}

/** Lanza un padre-con-nieto registrado con ese modo y lo manda parar. */
async function pararConModo(modo: ModoDeMuerte): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-grupo-'))
  const child = spawn(conNieto(dir), [], { cwd: dir, detached: true })
  trackChild(child, 'A', modo)
  await esperar(300)
  killChildrenOf('A')
  await esperar(400)
  return dir
}

afterEach(() => killAllChildren())

describe('un proceso detached es un arbol, no un proceso', () => {
  it('en modo grupo el nieto muere: la senal alcanza al arbol', async () => {
    expect(nietoSigueVivo(await pararConModo('grupo'))).toBe(false)
  }, 20_000)

  it('en modo proceso el nieto SOBREVIVE, que es el fallo que esto arregla', async () => {
    // Esta es la prueba de que el modo sirve para algo: con la senal plana el
    // registro diria "matado 1" y el arbol seguiria corriendo.
    expect(nietoSigueVivo(await pararConModo('proceso'))).toBe(true)
  }, 20_000)

  it('el grupo de un proyecto no se lleva por delante el de otro', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fcc-grupo-b-'))
    const deB = spawn(conNieto(dir), [], { cwd: dir, detached: true })
    trackChild(deB, 'B', 'grupo')
    await esperar(300)

    expect(killChildrenOf('A')).toBe(0)
    expect(liveChildCount()).toBe(1)
    expect(nietoSigueVivo(dir)).toBe(true)
  }, 20_000)
})
