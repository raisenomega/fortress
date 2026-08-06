import { execFile } from 'child_process'
import { err, ok, type Result } from '@domain/shared/result'

const ENV = { ...process.env, GIT_TERMINAL_PROMPT: '0' }
const TIMEOUT_MS = 30 * 1000

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
  '-m'
]

function run(cwd: string, args: readonly string[]): Promise<Result<string>> {
  return new Promise((resolve) => {
    execFile('git', [...args], { cwd, env: ENV, timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
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
