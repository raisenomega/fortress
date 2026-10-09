import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { createGraphCritico } from './graph-critico'

function fakeBin(script: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-critico-env-'))
  const file = join(dir, 'fake-claude')
  writeFileSync(file, `#!/bin/sh\n${script}\n`)
  chmodSync(file, 0o755)
  return file
}

/**
 * El entorno del hijo, medido con un binario que DECLARA lo que ve. Vive aparte
 * del fichero de la objecion porque son dos preguntas: que devuelve el critico,
 * y que NO le llega. Juntas pasaban de 75 lineas.
 */
describe('createGraphCritico — lo que el critico NO hereda', () => {
  afterEach(() => delete process.env.SSH_AUTH_SOCK)

  it('las llaves de la sesion viva del operador no bajan al hijo', async () => {
    process.env.SSH_AUTH_SOCK = '/run/user/1000/keyring/ssh'
    // El fake declara lo que VE: la unica forma de medir el entorno del hijo.
    const r = await createGraphCritico(fakeBin('echo "sock:[$SSH_AUTH_SOCK]"'), 'p1', true).run(tmpdir(), 'p') // prettier-ignore

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.texto).toContain('sock:[]')
  })
})
