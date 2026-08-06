import { execFile } from 'child_process'
import { err, ok, type Result } from '@domain/shared/result'

const ENV = { ...process.env, GIT_TERMINAL_PROMPT: '0' }
const TIMEOUT_MS = 30 * 1000
// Identidad inline: un repo recien creado no tiene user.name/email y `git commit`
// falla sin ellos. No toca la config global del operador.
const IDENTITY = ['-c', 'user.name=FORTRESS', '-c', 'user.email=fortress@raisen.local']

function run(cwd: string, args: readonly string[]): Promise<Result<string>> {
  return new Promise((resolve) => {
    execFile('git', [...args], { cwd, env: ENV, timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
      const output = `${stdout}${stderr}`.trim()
      resolve(error ? err(output || error.message) : ok(output))
    })
  })
}

/** `git add -A` + commit inicial. execFile con args separados: sin shell. */
export async function gitCommitAll(cwd: string, message: string): Promise<Result<string>> {
  const added = await run(cwd, ['add', '-A'])
  if (!added.ok) return added
  return run(cwd, [...IDENTITY, 'commit', '-m', message])
}
