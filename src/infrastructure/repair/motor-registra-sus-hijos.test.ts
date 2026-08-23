import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { killAllChildren, liveChildCount } from '../claude-code/child-registry'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { createGraphGenerator } from './graph-generator'

/**
 * Un binario que se queda dormido: da tiempo a pararlo antes de que acabe.
 *
 * `exec` no es adorno. Sin el, el shell y el `sleep` son DOS procesos: matar al
 * shell deja al hijo vivo con la tuberia abierta, y el `close` no llega nunca.
 * Es la misma trampa que el registro tiene que sortear en produccion, y aqui
 * habria hecho fallar la prueba por el banco y no por el codigo.
 */
function dormilon(): string {
  const bin = join(mkdtempSync(join(tmpdir(), 'fcc-motor-kill-')), 'lento')
  writeFileSync(bin, '#!/bin/sh\nexec sleep 30\n')
  chmodSync(bin, 0o755)
  return bin
}

afterEach(() => {
  killAllChildren()
  endRun('A')
  endRun('B')
})

describe('Detener alcanza a los agentes del motor en vuelo', () => {
  it('el generador queda registrado a nombre de su proyecto', async () => {
    const corriendo = createGraphGenerator(dormilon(), 'A', 60_000).generate(tmpdir(), 'p')
    await new Promise((r) => setTimeout(r, 150))

    expect(liveChildCount()).toBe(1)

    // Detener A lo mata: antes seguia hasta su propio timeout, minutos despues.
    expect(cancelRun('A')).toBe(1)
    await corriendo
    expect(liveChildCount()).toBe(0)
  }, 20_000)

  it('parar OTRO proyecto no lo toca, y el suyo no queda cancelado', async () => {
    const corriendo = createGraphGenerator(dormilon(), 'A', 3_000).generate(tmpdir(), 'p')
    await new Promise((r) => setTimeout(r, 150))

    expect(cancelRun('B')).toBe(0)
    expect(liveChildCount()).toBe(1)
    expect(isCancelled('A')).toBe(false)

    await corriendo
  }, 20_000)

  it('al terminar solo, se descuenta del registro sin que nadie lo mate', async () => {
    const bin = join(mkdtempSync(join(tmpdir(), 'fcc-motor-ok-')), 'rapido')
    writeFileSync(bin, '#!/bin/sh\necho "{}"\n')
    chmodSync(bin, 0o755)

    await createGraphGenerator(bin, 'A', 10_000).generate(tmpdir(), 'p')
    expect(liveChildCount()).toBe(0)
  }, 20_000)
})
