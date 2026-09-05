import { execFile } from 'child_process'
import { gitEnv } from './git-env'
import { err, ok, type Result } from '@domain/shared/result'

const TIMEOUT_MS = 30 * 1000
const ENV = gitEnv()

/**
 * `git init` en la carpeta recien creada. execFile con argumentos separados:
 * no hay shell, no hay inyeccion posible. Sobre una carpeta vacia es seguro.
 */
export function gitInit(cwd: string): Promise<Result<string>> {
  return new Promise((resolve) => {
    execFile('git', ['init'], { cwd, env: ENV, timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
      const output = `${stdout}${stderr}`.trim()
      resolve(error ? err(output || error.message) : ok(output || 'Repositorio git iniciado'))
    })
  })
}
