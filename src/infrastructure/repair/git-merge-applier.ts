import { execFile } from 'child_process'
import type { MergeApplier, MergeApplyOutcome } from '@domain/repair/merge-applier'

const TIMEOUT_MS = 2 * 60 * 1000

/**
 * LC_ALL=C no es cosmetica: clasificar el fallo se hace leyendo lo que git
 * dice, y git habla el idioma del operador. En una maquina en espanol el
 * conflicto se anuncia distinto y el motor lo archivaria como `unknown`.
 * GIT_TERMINAL_PROMPT=0 evita que se quede esperando una contrasena que nadie
 * va a teclear: sin terminal el prompt no se ve y el merge parece colgado.
 */
const ENV = { ...process.env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C', LANG: 'C' }

interface Corrida {
  readonly fallo: boolean
  readonly salida: string
}

/** execFile con argumentos separados: no hay shell, no hay inyeccion posible. */
function git(cwd: string, args: readonly string[]): Promise<Corrida> {
  return new Promise((resolve) => {
    const options = { cwd, env: ENV, timeout: TIMEOUT_MS }
    execFile('git', [...args], options, (error, stdout, stderr) => {
      // git escribe el progreso en stderr aunque todo vaya bien.
      resolve({ fallo: error !== null, salida: `${stdout}${stderr}`.trim() })
    })
  })
}

/** Lo que git dijo, traducido a lo que el operador tiene que hacer distinto. */
function clasificar(salida: string): 'conflict' | 'dirty-tree' | 'unknown' {
  if (/CONFLICT|Merge conflict/i.test(salida)) return 'conflict'
  if (/commit your changes|uncommitted|local changes/i.test(salida)) return 'dirty-tree'
  return 'unknown'
}

/**
 * Integra la rama del fix en la rama viva del proyecto. La rama destino se
 * RESUELVE, no se asume: el proyecto puede no llamarla main.
 *
 * Un merge que falla por conflicto deja el repo a medias —MERGE_HEAD escrito,
 * indice en conflicto, marcadores en los archivos—, asi que el abort no es una
 * cortesia: sin el, el motor dejaria intervenido el arbol del operador
 * justo cuando acaba de decidir que no lo tocaba.
 */
export function createGitMergeApplier(): MergeApplier {
  return {
    apply: async ({ projectPath, sourceBranch, commitMessage }): Promise<MergeApplyOutcome> => {
      const head = await git(projectPath, ['rev-parse', '--abbrev-ref', 'HEAD'])
      const targetBranch = head.salida
      if (head.fallo || targetBranch === '' || targetBranch === 'HEAD') {
        return { ok: false, kind: 'target-branch-detached' }
      }

      const merge = await git(projectPath, ['merge', '--no-ff', sourceBranch, '-m', commitMessage])
      if (merge.fallo) {
        // Restaurar ANTES de clasificar. Si no habia merge que abortar, git
        // protesta y da igual: lo que importa es que el arbol quede limpio.
        await git(projectPath, ['merge', '--abort'])
        return { ok: false, kind: clasificar(merge.salida), gitOutput: merge.salida }
      }

      const sha = await git(projectPath, ['rev-parse', 'HEAD'])
      if (sha.fallo || sha.salida === '') {
        return { ok: false, kind: 'unknown', gitOutput: sha.salida }
      }
      return { ok: true, mergeCommitSha: sha.salida, targetBranch }
    }
  }
}
