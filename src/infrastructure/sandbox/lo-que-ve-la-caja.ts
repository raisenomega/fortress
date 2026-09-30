import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { RaizDelSistema } from '@domain/sandbox/flags-de-bwrap'
import { interpreteExiste } from '../project/interprete-existe'

/** Las raices del sistema que un binario necesita para arrancar. `/bin`, `/lib`
 *  y `/lib64` son enlaces a `/usr` en un sistema fusionado; si en esta maquina
 *  son directorios, entran como tales. Lo que no exista, no entra. */
export function raicesDelSistema(): readonly RaizDelSistema[] {
  const raiz = (ruta: string): RaizDelSistema => {
    try {
      const real = realpathSync(ruta)
      return real === ruta ? { ruta, enlaceA: null } : { ruta, enlaceA: real.replace(/^\//, '') }
    } catch {
      return { ruta, enlaceA: null }
    }
  }
  return [{ ruta: '/usr', enlaceA: null }, ...['/bin', '/lib', '/lib64', '/sbin'].filter(existsSync).map(raiz)] // prettier-ignore
}

/**
 * Las cabeceras publicas de Node y Electron (ADR-108). Sin ellas `node-gyp
 * configure` sale a descargarlas, el proxy lo niega y el `npm ci` del gate
 * muere: 99 de 99 verdes antes de la caja, 0 de 3 despues (DEUDAS §11.1).
 *
 * LOS DIRECTORIOS PADRE, NUNCA `<padre>/<version>`. Montar por version
 * obligaria a sacar la version de algun sitio, y el sitio natural seria el
 * `package.json` del proyecto: un dato que el repo AUDITADO controla, entrando
 * en la lista de montajes de la caja. Es la forma exacta del error que costo la
 * trifecta del aislamiento, y los padres lo evitan gratis porque no piden
 * ninguna entrada.
 *
 * SOLO LECTURA, y esa es la casilla que importa: la clase B corre tambien sobre
 * repos de CLIENTE, y con montaje escribible un proceso de la caja de un cliente
 * envenenaria la cache REAL del operador, que despues compila el modulo nativo
 * de FORTRESS. Entran por `soloLectura`, nunca por `escritura`.
 *
 * Contenido medido el 2026-09-30: 2846 ficheros `.h`, 4 `.gypi`, 2
 * `installVersion`, cero enlaces simbolicos. Artefactos publicos: ni un dato del
 * operador, ni de un cliente, ni de otro cliente.
 */
export const CABECERAS_PUBLICAS: readonly string[] = [
  join(homedir(), '.electron-gyp'),
  join(homedir(), '.cache', 'node-gyp')
]

/** El directorio de instalacion del `node` que ve ESE PATH: el que `augmentPath`
 *  completo. NO `process.execPath`: dentro de la app eso es el AppImage de
 *  FORTRESS, y montarlo habria montado `~/.local` en vez de node (medido). */
export function directorioDeNode(path: string): string | null {
  const bin = path.split(':').find((d) => d !== '' && interpreteExiste(join(d, 'node')))
  if (bin === undefined) return null
  try {
    return dirname(dirname(realpathSync(join(bin, 'node'))))
  } catch {
    return null
  }
}

/**
 * El `.git` comun de un worktree: su `.git` es un FICHERO `gitdir: …/.git/worktrees/x`,
 * y git necesita el repo entero. Sin eso, `git` dentro de la caja no ve nada.
 *
 * Este fichero LO ESCRIBE EL REPO AUDITADO, asi que no es fuente de verdad: lo
 * que diga acaba en la lista de ESCRITURA de la caja. Por eso no basta con leer
 * el texto — se exige que el worktree que nombra EXISTA como directorio. Medido
 * el 2026-09-29 con un bwrap real: sin esa comprobacion, un `gitdir:
 * /home/jojo/worktrees/x` montaba el HOME entero en escritura, y uno que
 * apuntaba al repo de OTRO cliente lo abria igual. Lo segundo la cota de anchura
 * no lo caza; esto si, porque ese directorio el cliente no lo puede crear ahi.
 *
 * Fail-closed: si no existe, `statSync` lanza y no se monta nada.
 */
export function gitComunDe(cwd: string): readonly string[] {
  try {
    const m = /^gitdir: (.+?)\/worktrees\/(.+)/.exec(readFileSync(join(cwd, '.git'), 'utf8'))
    if (m?.[1] === undefined || m[2] === undefined) return []
    return statSync(join(m[1], 'worktrees', m[2].trim())).isDirectory() ? [m[1]] : []
  } catch {
    return []
  }
}
