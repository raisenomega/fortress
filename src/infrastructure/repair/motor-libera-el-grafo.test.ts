import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { GrafoDelTurnoPort } from '../graph/grafo-del-turno'
import { createGraphCritico } from './graph-critico'
import { createGraphGenerator } from './graph-generator'
import { createGraphOmega } from './graph-omega'

const raiz = mkdtempSync(join(tmpdir(), 'motor-grafo-'))
afterAll(() => rmSync(raiz, { recursive: true, force: true }))

/** Un `claude` de mentira que solo contesta. */
function fakeBin(): string {
  const bin = join(raiz, `claude-${Math.random().toString(36).slice(2)}`)
  writeFileSync(bin, '#!/bin/sh\necho "{\\"result\\":\\"ok\\"}"\n')
  chmodSync(bin, 0o755)
  return bin
}

/** Un puerto que APUNTA cuantas veces se preparo y se libero el store del turno. */
function puerto(): { port: GrafoDelTurnoPort; preparados: number; liberados: number } {
  const p = { preparados: 0, liberados: 0, port: undefined as unknown as GrafoDelTurnoPort }
  p.port = {
    preparar: () => {
      p.preparados += 1
      return Promise.resolve({
        dir: join(raiz, `turno-${p.preparados}`),
        liberar: () => void (p.liberados += 1)
      })
    }
  }
  return p
}

describe('los corredores del motor preparan el store del turno y lo liberan al cerrar', () => {
  it('generador, OMEGA y critico: un preparar y un liberar por corrida', async () => {
    const g = puerto()
    await createGraphGenerator(fakeBin(), 'p1', true, 10_000, g.port).generate(raiz, 'p') // prettier-ignore
    const o = puerto()
    await createGraphOmega(fakeBin(), 'p1', true, 10_000, o.port).run(raiz, 'p') // prettier-ignore
    const c = puerto()
    await createGraphCritico(fakeBin(), 'p1', true, 10_000, c.port).run(raiz, 'p') // prettier-ignore
    for (const p of [g, o, c]) expect([p.preparados, p.liberados]).toEqual([1, 1])
  })

  it('un binario que no existe tambien libera: el store no sobrevive a un fallo de arranque', async () => {
    const o = puerto()
    await createGraphOmega('/no/existe/claude', 'p1', true, 10_000, o.port).run(raiz, 'p')
    expect([o.preparados, o.liberados]).toEqual([1, 1])
  })
})
