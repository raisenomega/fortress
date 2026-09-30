import { homedir } from 'node:os'
import { err, ok, type Result } from '@domain/shared/result'
import { flagsDeBwrap } from '@domain/sandbox/flags-de-bwrap'
import { dentroDe } from '@domain/sandbox/ruta-de-la-caja'
import { CABECERAS_PUBLICAS } from './cabeceras-publicas'
import { directorioDeNode, gitComunDe, raicesDelSistema } from './lo-que-ve-la-caja'
import { conPuente } from './puente-del-proxy'
import { BWRAP, cajaDisponible } from './sonda-de-bwrap'

export interface Lanzamiento {
  readonly bin: string
  readonly args: readonly string[]
}

/**
 * Un comando de la CLASE B, envuelto: FORTRESS lanza `bwrap` y dentro va el
 * comando (ADR-092, casilla 3). Sin red, salvo que venga `socketDelProxy`: entonces
 * la unica salida es el puente hacia ese socket, y la lista la decide el proxy.
 *
 * FAIL-CLOSED (casilla 4): si la caja no se puede levantar, NO hay comando. La
 * sonda es un `bwrap` real, no un PATH, y se recuerda por PATH (`cajaDisponible`).
 * Y sin `node` en el PATH tampoco: dentro no habria con que correr `npm`.
 *
 * `--` antes del comando: lo que venga despues son argumentos del comando y
 * nunca flags de bwrap, aunque empiecen por `--`.
 *
 * `escritura`: rutas FUERA del proyecto que el comando tiene que dejar en el
 * disco de verdad —el destino de un `git worktree add`—. Sin declararlas, lo
 * que se escribe ahi cae en el tmpfs de la caja y se evapora al salir (medido:
 * el worktree del motor quedaba registrado en `.git` y sin directorio).
 */
export function enCaja(
  bin: string,
  args: readonly string[],
  proyecto: string,
  cwd: string,
  path = process.env.PATH ?? '',
  escritura: readonly string[] = [],
  socketDelProxy: string | null = null
): Result<Lanzamiento> {
  const disponible = cajaDisponible(path)
  if (!disponible.ok) return err(`sin-caja:${disponible.error}`)

  const node = directorioDeNode(path)
  if (node === null) return err('sin-caja:falta-node')
  // El binario que se lanza tiene que estar DENTRO de lo que la caja ve. Uno
  // por ruta absoluta fuera de /usr, de node y del proyecto —un `npm` de otra
  // instalacion, o el binario de un test— entra el solo, en solo lectura.
  const propio =
    bin.startsWith('/') && ![node, proyecto, '/usr'].some((r) => dentroDe(r, bin)) ? [bin] : []
  const flags = flagsDeBwrap({
    proyecto,
    cwd,
    home: homedir(),
    sistema: raicesDelSistema(),
    soloLectura: [node, ...propio, ...CABECERAS_PUBLICAS].filter((r) => !dentroDe(proyecto, r)),
    escritura: [...gitComunDe(cwd), ...escritura].filter((r) => r !== proyecto),
    socketDelProxy
  })
  const comando = socketDelProxy === null ? [bin, ...args] : conPuente(bin, args)
  return flags.ok
    ? ok({ bin: BWRAP, args: [...flags.value, '--', ...comando] })
    : err(`sin-caja:${flags.error}`)
}
