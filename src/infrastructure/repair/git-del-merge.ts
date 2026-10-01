import { execFile } from 'child_process'
import { buildEnv } from '../claude-code/build-env'
import { enCaja } from '../sandbox/en-caja'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'

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
/**
 * SE COMPONE AL LLAMAR, NUNCA AL CARGAR EL MODULO, como sus tres hermanos
 * (`spawn-command`, `repair-git`, `run-command`). Era un `const` de modulo, y
 * los imports se evaluan ANTES del `augmentPath()` del arranque: una app abierta
 * con doble clic congelaba aqui su PATH minimo, sin `node`, y la caja no podia
 * levantarse. El merge —el ULTIMO paso de la firma— moria con
 * `sin-caja:falta-node` y se archivaba como `target-branch-detached`, con el
 * HEAD en su rama. Medido el 2026-10-01: la primera firma del operador, DEUDAS §14.
 */
function entornoDelMerge(): NodeJS.ProcessEnv {
  return { ...buildEnv(null), GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C', LANG: 'C' }
}

export interface Corrida {
  readonly fallo: boolean
  readonly salida: string
}

/** execFile con argumentos separados: no hay shell, no hay inyeccion posible.
 *  DENTRO DE LA CAJA (ADR-092, clase B): el arbol vivo del cliente, y nada mas.
 *  Sin caja no hay merge: fail-closed con el motivo en stderr. */
export function git(cwd: string, args: readonly string[]): Promise<Corrida> {
  const env = entornoDelMerge()
  const caja = enCaja('git', [...SIN_HOOKS, ...args], cwd, cwd, env['PATH'])
  if (!caja.ok) return Promise.resolve({ fallo: true, salida: caja.error })
  return new Promise((resolve) => {
    const options = { cwd, env, timeout: TIMEOUT_MS }
    execFile(caja.value.bin, [...caja.value.args], options, (error, stdout, stderr) => {
      // git escribe el progreso en stderr aunque todo vaya bien.
      resolve({ fallo: error !== null, salida: `${stdout}${stderr}`.trim() })
    })
  })
}
