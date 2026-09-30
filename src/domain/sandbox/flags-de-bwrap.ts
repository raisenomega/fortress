import { err, ok, type Result } from '../shared/result'
import { porQueNoSeMonta } from './ruta-de-la-caja'

/** Una raiz del sistema: directorio real, o enlace (`/bin` -> `usr/bin`). */
export interface RaizDelSistema {
  readonly ruta: string
  readonly enlaceA: string | null
}

export interface Caja {
  readonly proyecto: string
  readonly cwd: string
  readonly home: string
  readonly sistema: readonly RaizDelSistema[]
  /** Lo que hace falta para CORRER y no es del proyecto: el directorio de node. */
  readonly soloLectura: readonly string[]
  /** Escritura ademas del proyecto: el `.git` comun de un worktree. */
  readonly escritura: readonly string[]
  /** El socket UNIX del proxy de registros, o null: sin red. */
  readonly socketDelProxy: string | null
}

export const SOCKET_EN_LA_CAJA = '/run/fortress-proxy.sock'
export const PUENTE = 'http://127.0.0.1:3128'

// Lo minimo de /etc para que un binario arranque y valide TLS. `-try`: lo que
// no exista en esta maquina se salta, en vez de tumbar la caja entera.
const ETC = ['ssl', 'passwd', 'group', 'nsswitch.conf', 'hosts', 'ld.so.cache', 'ld.so.conf', 'ld.so.conf.d', 'alternatives', 'localtime'] // prettier-ignore

const par = (flag: string, ruta: string): string[] => [flag, ruta, ruta]

const red = (socket: string | null): string[] =>
  socket === null
    ? []
    : [
        ...['--ro-bind', socket, SOCKET_EN_LA_CAJA],
        ...['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy'].flatMap((v) => ['--setenv', v, PUENTE]) // prettier-ignore
      ]

/**
 * Los flags que encierran a un proceso en su proyecto (ADR-092, casillas 1 y 2).
 *
 * EL ORDEN ES EL CONTRATO: bwrap monta de izquierda a derecha. Primero se TAPA
 * —`/tmp`, `/run` y el HOME, con un tmpfs vacio— y despues se monta encima lo
 * poco que si se ve. Al reves, el tmpfs del HOME taparia el proyecto.
 *
 * `--unshare-all` quita tambien la red. No hay `--share-net` en ningun camino:
 * la unica salida es el socket del proxy, que entra en SOLO LECTURA y a una ruta
 * fija. La lista de hosts vive al otro lado, fuera de la caja.
 *
 * Medido con bwrap 0.9.0 el 2026-09-21, tambien sobre vfat y con espacios en la
 * ruta. `node` vive DENTRO del HOME (nvm): por eso «no leer el home» no es
 * literal, y `soloLectura` existe.
 */
export function flagsDeBwrap(caja: Caja): Result<readonly string[]> {
  const otras = [...caja.sistema.map((s) => s.ruta), ...caja.soloLectura, ...caja.escritura]
  // Sin red NO hay ruta que validar. Antes iba un `/` de relleno, que pasaba el
  // filtro de forma y ahora seria justo lo mas ancho que existe.
  const socket = caja.socketDelProxy === null ? [] : [caja.socketDelProxy]
  const motivo = porQueNoSeMonta({ ...caja, otras: [...otras, ...socket] })
  if (motivo !== null) return err(motivo)

  return ok([
    ...['--unshare-all', '--die-with-parent', '--new-session'],
    ...['--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--tmpfs', '/run'],
    ...['--tmpfs', caja.home],
    ...caja.sistema.flatMap((s) => s.enlaceA === null ? par('--ro-bind', s.ruta) : ['--symlink', s.enlaceA, s.ruta]), // prettier-ignore
    ...ETC.flatMap((e) => par('--ro-bind-try', `/etc/${e}`)),
    ...caja.soloLectura.flatMap((r) => par('--ro-bind', r)),
    ...red(caja.socketDelProxy),
    ...[...caja.escritura, caja.proyecto].flatMap((r) => par('--bind', r)),
    ...['--chdir', caja.cwd]
  ])
}
