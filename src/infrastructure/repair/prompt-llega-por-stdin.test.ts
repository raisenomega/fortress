import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, describe, expect, it } from 'vitest'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { createGraphAnalyst } from './graph-analyst'

afterAll(limpiarCarpetasDePrueba)

/** Un `claude` falso que ES `cat`: devuelve EXACTAMENTE lo que le llego por
 *  stdin. Si el spawner no escribe el prompt (el mutante de ADR-112), la
 *  salida queda vacia y este test lo ve. */
const claudeQueEsCat = (): string => {
  const bin = join(mkdtempSync(join(tmpdir(), 'fcc-cat-')), 'claude')
  writeFileSync(bin, '#!/bin/sh\ncat\n')
  chmodSync(bin, 0o755)
  return bin
}

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'x' }

describe('ADR-112: el spawner ESCRIBE el prompt en el stdin del hijo', () => {
  it('con un hijo que ecoa stdin, el prompt entero vuelve como salida cruda', async () => {
    const proyecto = carpetaDePrueba('.fortress-stdin-eco-')
    const analista = createGraphAnalyst(claudeQueEsCat(), proyecto, 'p-stdin')
    const out = await analista.study(TARGET, [])
    // `cat` no devuelve JSON: el analisis sale ilegible y el crudo ENTERO viaja
    // en `raw` — que tiene que SER el prompt, porque es lo unico que entro.
    expect(out.raw).toBeDefined()
    expect(out.raw).toContain('Tienes Bash')
    expect(out.raw).toContain(TARGET.file)
  })
})
