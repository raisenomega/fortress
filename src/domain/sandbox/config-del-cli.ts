import { err, ok, type Result } from '../shared/result'
import { esRegistro } from './registros-de-paquetes'
import { rutaLimpia } from './ruta-de-la-caja'

export interface CajaDelCli {
  readonly proyecto: string
  /** Lo que hace falta para correr y no es del proyecto: el directorio de node. */
  readonly soloLectura: readonly string[]
  /** Hosts de la tabla cerrada. Cualquier otro se rechaza: aqui no se ensancha. */
  readonly registros: readonly string[]
}

// El HOME, y donde se montan otros discos: ahi viven los OTROS proyectos.
const NEGADO = ['~/', '/media', '/mnt', '/run/media'] as const

/**
 * La config de sandbox que se le pasa al CLI por spawn (ADR-092, clase A).
 *
 * MEDIDA, no deducida. El 2026-09-21, con el CLI 2.1.278 en `-p` + `acceptEdits`
 * y un `npm run` pre-aprobado por `--allowedTools` —o sea, con la correa de hoy
 * puesta—, esta config exacta contuvo al script: no vio la carpeta de otro
 * cliente, su escritura fuera no llego al disco, el registro respondio 200 y
 * `example.com` quedo negado. `~/.npm` dentro de la caja NO es la cache real.
 *
 * TRES CAMPOS QUE NO SE NEGOCIAN, y la documentacion dice por que:
 *  - sin `denyRead` la lectura por defecto es «the entire computer»;
 *  - sin `failIfUnavailable` el sandbox que no arranca se SALTA con un aviso;
 *  - sin `allowUnsandboxedCommands: false` lo que falla dentro se reintenta fuera.
 *
 * `autoAllowBashIfSandboxed: false`: la caja se pone y la correa SIGUE. Soltar
 * Bash es ADR-093 Pieza 3, otro arco con sus propios tests.
 */
export function configDelSandbox(caja: CajaDelCli): Result<object> {
  const rutas = [caja.proyecto, ...caja.soloLectura]
  if (!rutas.every(rutaLimpia)) return err('ruta-no-absoluta-o-sucia')
  if (!caja.registros.every(esRegistro)) return err('host-fuera-de-la-tabla')

  return ok({
    sandbox: {
      enabled: true,
      failIfUnavailable: true,
      allowUnsandboxedCommands: false,
      autoAllowBashIfSandboxed: false,
      filesystem: { denyRead: [...NEGADO], allowRead: rutas },
      network: { allowedDomains: [...caja.registros] }
    }
  })
}

/** Por `--settings` y no por un fichero: el `.claude/` del cliente ni se toca
 *  —esta protegido, y es suyo—, y la config muere con el proceso. */
export function argsDelSandbox(caja: CajaDelCli): Result<readonly string[]> {
  const config = configDelSandbox(caja)
  return config.ok ? ok(['--settings', JSON.stringify(config.value)]) : config
}
