import { spawnSync } from 'child_process'
import { join } from 'node:path'
import { err, ok, type Result } from '@domain/shared/result'
import { interpreteExiste } from '../project/interprete-existe'

export const BWRAP = 'bwrap'
export const SOCAT = 'socat'

const CANARIO = 'fortress-caja-ok'
const TIMEOUT_MS = 5000

/**
 * Si la caja se puede levantar en ESTA maquina (ADR-092, casilla 4).
 *
 * «INSTALADO» NO ES «FUNCIONA», y por eso no basta mirar el PATH: bwrap crea
 * un user namespace, y un kernel o un AppArmor que los restrinja lo deja
 * instalado y muerto —Ubuntu 24 lo hace por defecto—. La unica prueba es
 * CORRER bwrap con una caja vacia y ver salir el canario. Es la misma leccion
 * que la barrera del proyecto: que arranque no es que proteja, y que exista no
 * es que arranque.
 *
 * Y `socat` va en la misma pregunta: sin el no hay puente al proxy, y la red
 * «solo a registros» seria red cerrada a secas. Falta uno, falta todo.
 *
 * `spawnSync` con args en array, jamas shell: lo que corre aqui es NUESTRO
 * binario con NUESTROS flags; no entra nada del proyecto.
 */
export function sondaDeBwrap(path = process.env.PATH ?? '', timeoutMs = TIMEOUT_MS): Result<void> {
  const bwrap = rutaEn(path, BWRAP)
  if (bwrap === null) return err('falta-bwrap')
  if (!interpreteExiste(SOCAT, path)) return err('falta-socat')

  const caja = ['--unshare-all', '--die-with-parent', '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib64', '/lib64', '--proc', '/proc', '--dev', '/dev'] // prettier-ignore
  const salida = spawnSync(bwrap, [...caja, '/bin/echo', CANARIO], {
    env: { PATH: path },
    encoding: 'utf8',
    timeout: timeoutMs
  })
  const corrio = salida.error === undefined && salida.status === 0
  return corrio && salida.stdout.trim() === CANARIO ? ok(undefined) : err('bwrap-no-arranca')
}

const memo = new Map<string, Result<void>>()

/**
 * La sonda, recordada POR PATH y por proceso: un `bwrap` real cuesta un fork y
 * la respuesta no cambia mientras el PATH sea el mismo. Por PATH y no una sola
 * casilla: un PATH sin bwrap no envenena al bueno, ni al reves. Las dos clases
 * (A y B) preguntan AQUI: una memoria, no dos que se desincronicen.
 */
export function cajaDisponible(path = process.env.PATH ?? ''): Result<void> {
  const previa = memo.get(path)
  if (previa !== undefined) return previa
  const ahora = sondaDeBwrap(path)
  memo.set(path, ahora)
  return ahora
}

/** Solo para tests: olvida lo que la sonda contesto. */
export const olvidarSonda = (): void => memo.clear()

/** La ruta del binario EN ESE PATH, resuelta aqui y lanzada por ruta: asi la
 *  respuesta no depende de como resuelva nombres el `spawnSync` de cada Node
 *  (medido en 24.18: si respeta `env.PATH`; no se apuesta a que todos lo hagan). */
function rutaEn(path: string, binario: string): string | null {
  const dir = path.split(':').find((d) => d !== '' && interpreteExiste(join(d, binario)))
  return dir === undefined ? null : join(dir, binario)
}
