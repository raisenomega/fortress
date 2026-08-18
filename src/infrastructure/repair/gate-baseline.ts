import { git } from './repair-git'
import { spawnCommand } from './spawn-command'

/** Tocar las dependencias invalida la medida: el `npm ci` instalado ya no es el de la base. */
const DEPENDENCIAS = ['package.json', 'package-lock.json']

export interface MedidaHerencia {
  /** true si el comando ya fallaba en la base y el fix no empeora lo suyo. */
  readonly heredado: boolean
  /** Por que no se pudo medir, cuando no se midio. */
  readonly sinMedir?: string
}

/** Los ficheros que el fix separa de la base, tal como los ve git. */
export async function ficherosDelFix(worktreePath: string, baseSha: string): Promise<string[]> {
  const { code, out } = await git(worktreePath, ['diff', '--name-only', baseSha, 'HEAD'])
  return code === 0 ? out.split('\n').filter((linea) => linea.trim() !== '') : []
}

/**
 * Cuantas lineas de la salida hablan de un fichero del fix. No parsea ninguna
 * herramienta: cada una escribe la ruta del fichero que la ofende, y eso basta
 * para saber si el fix esta anadiendo ruido propio. Contar de mas es el sesgo
 * seguro — se acaba culpando al fix, nunca absolviendolo por error.
 */
export function ruidoPropio(salida: string, ficheros: readonly string[]): number {
  if (ficheros.length === 0) return 0
  return salida.split('\n').filter((linea) => ficheros.some((fichero) => linea.includes(fichero)))
    .length
}

/**
 * Que habria hecho ese mismo comando sobre la base, medido EN DIFERIDO: solo
 * cuando algo falla, y solo del comando que fallo. Sin cache — el gate ya
 * aprendio en I1 que un resultado guardado miente— y sin worktree nuevo: se
 * visita la base en el mismo sitio, que es lo unico que hace comparables las
 * dos salidas, y se vuelve a la rama del fix al terminar.
 */
export async function medirHerencia(
  bin: string,
  worktreePath: string,
  baseSha: string,
  comando: { key: string; args: readonly string[]; timeoutMs: number },
  salidaDelFix: string
): Promise<MedidaHerencia> {
  const ficheros = await ficherosDelFix(worktreePath, baseSha)
  if (ficheros.some((f) => DEPENDENCIAS.includes(f))) {
    return { heredado: false, sinMedir: 'el fix toca las dependencias' }
  }

  const rama = (await git(worktreePath, ['rev-parse', '--abbrev-ref', 'HEAD'])).out.trim()
  const ida = await git(worktreePath, ['checkout', '--quiet', baseSha])
  if (ida.code !== 0) return { heredado: false, sinMedir: 'no se pudo visitar la base' }

  const enLaBase = await spawnCommand(bin, comando.key, comando.args, worktreePath, comando.timeoutMs) // prettier-ignore
  await git(worktreePath, ['checkout', '--quiet', rama])

  // A: si en la base ya estaba rojo, el rojo no nace con el fix.
  if (enLaBase.exitCode === 0 || enLaBase.timedOut) return { heredado: false }

  // B: y ademas el fix no anade ruido en los ficheros que toca.
  const antes = ruidoPropio(enLaBase.stdoutTail + enLaBase.stderrTail, ficheros)
  const ahora = ruidoPropio(salidaDelFix, ficheros)
  return { heredado: ahora <= antes }
}
