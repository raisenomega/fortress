import { homedir } from 'node:os'
import { err, ok, type Result } from '@domain/shared/result'
import { flagsDeBwrap } from '@domain/sandbox/flags-de-bwrap'
import { directorioDeNode, gitComunDe, raicesDelSistema } from './lo-que-ve-la-caja'
import { BWRAP, sondaDeBwrap } from './sonda-de-bwrap'

export interface Lanzamiento {
  readonly bin: string
  readonly args: readonly string[]
}

let disponible: Result<void> | null = null

/**
 * Un comando de la CLASE B, envuelto: FORTRESS lanza `bwrap` y dentro va el
 * comando (ADR-092, casilla 3). Sin red: la clase B no la necesita hoy —`npm ci`
 * pasa por el registro, y eso llega en su propio arco con el proxy—.
 *
 * FAIL-CLOSED (casilla 4): si la caja no se puede levantar, NO hay comando. La
 * sonda corre UNA vez por proceso y se guarda: es un `bwrap` real, no un PATH.
 * Y sin `node` en el PATH tampoco: dentro no habria con que correr `npm`.
 *
 * `--` antes del comando: lo que venga despues son argumentos del comando y
 * nunca flags de bwrap, aunque empiecen por `--`.
 */
export function enCaja(
  bin: string,
  args: readonly string[],
  proyecto: string,
  cwd: string,
  path = process.env.PATH ?? ''
): Result<Lanzamiento> {
  disponible ??= sondaDeBwrap(path)
  if (!disponible.ok) return err(`sin-caja:${disponible.error}`)

  const node = directorioDeNode(path)
  if (node === null) return err('sin-caja:falta-node')
  const flags = flagsDeBwrap({
    proyecto,
    cwd,
    home: homedir(),
    sistema: raicesDelSistema(),
    soloLectura: [node].filter((r) => !r.startsWith(proyecto)),
    escritura: gitComunDe(cwd).filter((r) => r !== proyecto),
    socketDelProxy: null
  })
  return flags.ok
    ? ok({ bin: BWRAP, args: [...flags.value, '--', bin, ...args] })
    : err(`sin-caja:${flags.error}`)
}

/** Solo para tests: olvida el resultado de la sonda. */
export const olvidarSonda = (): void => {
  disponible = null
}
