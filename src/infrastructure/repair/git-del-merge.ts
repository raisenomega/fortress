import { execFile } from 'child_process'
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
/**
 * LISTA BLANCA, como el gate (`buildGateEnv`), y no el recorte de `buildEnv`:
 * ese recorte deja pasar todo lo que no sea sesion viva —tokens de terceros,
 * `ANTHROPIC_API_KEY`, y cualquier `GIT_*` del operador (`GIT_DIR`,
 * `GIT_CONFIG_*`, `GIT_EXEC_PATH`) que cambia que repo o que configuracion
 * toca el merge en el arbol VIVO. La caja no lo corta: bwrap entrega el env
 * intacto. La identidad del autor SI se reenvia si existe: `merge --no-ff`
 * crea un commit, y en la caja el HOME es tmpfs y `~/.gitconfig` no se ve.
 */
const COPIADAS: readonly string[] = ['PATH', 'HOME']
const REENVIADAS: readonly string[] = [
  'TMPDIR',
  'LANG',
  'LC_ALL',
  'GIT_AUTHOR_NAME',
  'GIT_AUTHOR_EMAIL',
  'GIT_COMMITTER_NAME',
  'GIT_COMMITTER_EMAIL',
  'EMAIL'
]
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
  const env: Record<string, string> = {}
  for (const clave of [...COPIADAS, ...REENVIADAS]) {
    const valor = process.env[clave]
    if (valor !== undefined) env[clave] = valor
  }
  // Las fijas DESPUES de las reenviadas: el LC_ALL del operador no las pisa.
  return { ...env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C', LANG: 'C' }
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
