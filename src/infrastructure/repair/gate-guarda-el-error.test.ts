import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { spawnCommand } from './spawn-command'

/**
 * ADR-115 A1, la forma MEDIDA el 2026-10-05 (`b9a60bd9`): el lint del worktree
 * imprime la cabecera del fichero y su error PRIMERO, y despues 151 warnings de
 * otros ficheros. El buffer rota mientras llega la salida, asi que el error se
 * pierde en vuelo: la autopsia solo veia warnings, y hubo que rehacer el lint a
 * mano para saber por que cayo. Aqui, 400 warnings: unos 40 KB.
 */
function lintConElErrorEnterrado(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-lint-'))
  const bin = join(dir, 'lint')
  const ruido = 'echo "  12:21  warning  Replace `x` with `y`  prettier/prettier and some padding text"'
  const cuerpo = [
    'echo "/tmp/wt/scripts/medir-deriva.spec.ts"',
    'echo "  13:1  error  Missing return type on function  @typescript-eslint/explicit-function-return-type"', // prettier-ignore
    `i=0; while [ $i -lt 400 ]; do ${ruido}; i=$((i+1)); done`,
    'echo "✖ 401 problems (1 error, 400 warnings)"',
    'exit 1'
  ]
  writeFileSync(bin, `#!/bin/sh\n${cuerpo.join('\n')}\n`)
  chmodSync(bin, 0o755)
  return bin
}

describe('el gate guarda el error aunque lo entierren los warnings', () => {
  it('la cola sola lo pierde: es el hueco que A1 tapa', async () => {
    const r = await spawnCommand(lintConElErrorEnterrado(), 'lint', [], tmpdir(), 20_000)
    expect(r.exitCode).toBe(1)
    expect(r.stdoutTail).not.toContain('Missing return type')
  })

  it('las lineas de error sobreviven, con su fichero', async () => {
    const r = await spawnCommand(lintConElErrorEnterrado(), 'lint', [], tmpdir(), 20_000)
    expect(r.errores).toEqual([
      '/tmp/wt/scripts/medir-deriva.spec.ts 13:1  error  Missing return type on function  @typescript-eslint/explicit-function-return-type' // prettier-ignore
    ])
  })
})
