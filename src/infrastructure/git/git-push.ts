import { execFile } from 'child_process'
import { gitEnvRemoto } from './git-env'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'
import type { GitPusher } from '@domain/project/git-pusher'
import { err, ok } from '@domain/shared/result'

const TIMEOUT_MS = 2 * 60 * 1000

/**
 * GIT_TERMINAL_PROMPT=0 evita que git se quede esperando un usuario y una
 * contrasena que nadie va a teclear: sin terminal, el prompt no se ve y el
 * push parece colgado. Asi falla rapido y con un motivo legible.
 */
const ENV = gitEnvRemoto()

/** execFile con argumentos separados: no hay shell, no hay inyeccion posible.
 *  Sin los hooks del cliente (ADR-092, git opcion B): `pre-push` es codigo suyo. */
export function createGitPusher(): GitPusher {
  return {
    push: (projectPath) =>
      new Promise((resolve) => {
        const options = { cwd: projectPath, env: ENV, timeout: TIMEOUT_MS }

        execFile('git', [...SIN_HOOKS, 'push'], options, (error, stdout, stderr) => {
          // git escribe el progreso en stderr aunque todo vaya bien.
          const output = `${stdout}${stderr}`.trim()
          resolve(error ? err(output || error.message) : ok(output || 'Push completado'))
        })
      })
  }
}
