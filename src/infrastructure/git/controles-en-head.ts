import { execFile } from 'child_process'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'
import { gitEnv } from './git-env'

const ENV = gitEnv()
const TIMEOUT_MS = 15 * 1000
const MAX_BUFFER = 8 * 1024 * 1024

function git(cwd: string, args: readonly string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const opts = { cwd, env: ENV, timeout: TIMEOUT_MS, maxBuffer: MAX_BUFFER }
    execFile('git', [...SIN_HOOKS, ...args], opts, (error, out) =>
      resolve(error ? null : out.trim())
    )
  })
}

/** ¿`file` recibio `marcador` en algun commit? Pickaxe `-S`: la cuenta de
 *  apariciones cambio → lo introdujo un arreglo, no estuvo SIEMPRE. Vacio/null =
 *  no atribuido (un control trivial que ya estaba no prueba que alguien lo puso). */
async function atribuido(cwd: string, marcador: string, file: string): Promise<boolean> {
  const log = await git(cwd, ['log', '--oneline', `-S${marcador}`, '--', file])
  return log !== null && log !== ''
}

/**
 * Ficheros bajo `src/` (sin tests ni fixtures) que CONTIENEN `marcador` en HEAD y
 * donde fue INTRODUCIDO. `git grep <tree>` mira HEAD (no el arbol sucio); el `-F`
 * lo trata literal; los `:!` excluyen pruebas. La salida viene `HEAD:ruta`.
 */
export async function controlesEnHeadGit(
  cwd: string,
  marcador: string
): Promise<readonly string[]> {
  if (marcador.trim() === '') return []
  const grep = await git(cwd, ['grep', '-l', '-F', '-e', marcador, 'HEAD', '--', 'src', ':!*.test.ts', ':!*.test.tsx', ':!*fixture*']) // prettier-ignore
  if (grep === null || grep === '') return []
  const files = grep
    .split('\n')
    .map((l) => l.replace(/^HEAD:/, '').trim())
    .filter((l) => l !== '')
  const out: string[] = []
  for (const f of files) if (await atribuido(cwd, marcador, f)) out.push(f)
  return out
}
