import { execFile } from 'child_process'
import { gitEnv } from './git-env'
import { err, ok, type Result } from '@domain/shared/result'

const ENV = gitEnv()
const TIMEOUT_MS = 30 * 1000

// Hooks y fsmonitor son codigo del repo destino, y una carpeta reutilizada
// conserva los suyos (.git/hooks, el core.hooksPath de husky): un pre-commit
// que falle tumbaria la configuracion con un error opaco. Se apagan en cada
// invocacion, la del add incluida (post-index-change), sin escribir el
// .git/config del proyecto. `--no-verify` solo salta pre-commit y commit-msg;
// hooksPath a /dev/null apaga tambien prepare-commit-msg y post-commit. Un
// fsmonitor vacio es apagado en cualquier version de git. Se pierde el escaner
// de secretos que el operador tuviera en el pre-commit: la misma eleccion que
// C3 y el checkpoint (ADR-079). Los clean filters de .gitattributes no tienen
// interruptor global y siguen corriendo.
const SIN_CODIGO_DEL_REPO = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=']

// Identidad inline y firma desactivada: un repo recien creado no tiene
// user.name/email (git commit falla sin ellos) y un `commit.gpgsign` global
// buscaria una clave para un email que no es del operador y bloquearia el
// commit. No toca la config global del operador.
const COMMIT_ARGS = [
  '-c',
  'user.name=FORTRESS',
  '-c',
  'user.email=fortress@raisen.local',
  '-c',
  'commit.gpgsign=false',
  'commit',
  '--no-verify',
  '-m'
]

function run(cwd: string, args: readonly string[]): Promise<Result<string>> {
  const argv = [...SIN_CODIGO_DEL_REPO, ...args]
  return new Promise((resolve) => {
    execFile('git', argv, { cwd, env: ENV, timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
      const output = `${stdout}${stderr}`.trim()
      resolve(error ? err(output || error.message) : ok(output))
    })
  })
}

/**
 * Estagea SOLO los archivos indicados (nunca `git add -A`, que arrastraria
 * contenido preexistente/secretos si la carpeta se reutilizo) y commitea.
 */
export async function gitCommit(
  cwd: string,
  files: readonly string[],
  message: string
): Promise<Result<string>> {
  const added = await run(cwd, ['add', '--', ...files])
  if (!added.ok) return added
  return run(cwd, [...COMMIT_ARGS, message])
}
