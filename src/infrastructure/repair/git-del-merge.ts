import { execFile } from 'child_process'
import { buildEnv } from '../claude-code/build-env'
import { enCaja } from '../sandbox/en-caja'

const TIMEOUT_MS = 2 * 60 * 1000

/**
 * LC_ALL=C no es cosmetica: clasificar el fallo se hace leyendo lo que git
 * dice, y git habla el idioma del operador. En una maquina en espanol el
 * conflicto se anuncia distinto y el motor lo archivaria como `unknown`.
 * GIT_TERMINAL_PROMPT=0 evita que se quede esperando una contrasena que nadie
 * va a teclear: sin terminal el prompt no se ve y el merge parece colgado.
 */
// Sobre `buildEnv` y no sobre `process.env`: `git merge` ejecuta los HOOKS del
// repo auditado —codigo ajeno en el arbol vivo— y heredaban el agente ssh y el
// keyring del operador.
const ENV: NodeJS.ProcessEnv = {
  ...buildEnv(null),
  GIT_TERMINAL_PROMPT: '0',
  LC_ALL: 'C',
  LANG: 'C'
}

export interface Corrida {
  readonly fallo: boolean
  readonly salida: string
}

// Sin los hooks del repo auditado (ADR-092, git opcion B): `git merge` ejecuta
// `post-merge` del cliente, y ese es codigo ajeno corriendo con el operador.
const SIN_HOOKS = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=']

/** execFile con argumentos separados: no hay shell, no hay inyeccion posible.
 *  DENTRO DE LA CAJA (ADR-092, clase B): el arbol vivo del cliente, y nada mas.
 *  Sin caja no hay merge: fail-closed con el motivo en stderr. */
export function git(cwd: string, args: readonly string[]): Promise<Corrida> {
  const caja = enCaja('git', [...SIN_HOOKS, ...args], cwd, cwd, ENV['PATH'])
  if (!caja.ok) return Promise.resolve({ fallo: true, salida: caja.error })
  return new Promise((resolve) => {
    const options = { cwd, env: ENV, timeout: TIMEOUT_MS }
    execFile(caja.value.bin, [...caja.value.args], options, (error, stdout, stderr) => {
      // git escribe el progreso en stderr aunque todo vaya bien.
      resolve({ fallo: error !== null, salida: `${stdout}${stderr}`.trim() })
    })
  })
}
