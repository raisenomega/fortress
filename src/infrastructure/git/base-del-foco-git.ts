import { execFile } from 'child_process'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'
import { gitEnv } from './git-env'

const ENV = gitEnv()
const TIMEOUT_MS = 15 * 1000

function git(cwd: string, args: readonly string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('git', [...SIN_HOOKS, ...args], { cwd, env: ENV, timeout: TIMEOUT_MS }, (error, out) => {
      resolve(error ? null : out.trim())
    })
  })
}

/**
 * Padre del commit durable mas antiguo del fix de `findingId` (asunto
 * `fix(<findingId>)`, A-4). `--grep` con `-F` trata el patron como literal: los
 * parentesis del id no son regex. `--reverse` pone el mas antiguo primero. El
 * PADRE (`^`) es la base ANTES del fix. null si no hay commit, si es raiz sin
 * padre, o si git falla: el lector cae a la base del turno (HEAD).
 */
export async function baseDelFocoGit(cwd: string, findingId: string): Promise<string | null> {
  if (findingId.trim() === '') return null
  const log = await git(cwd, ['log', '--reverse', '--format=%H', '-F', `--grep=fix(${findingId})`])
  const masAntiguo = (log ?? '').split('\n')[0]?.trim()
  if (masAntiguo === undefined || masAntiguo === '') return null
  return git(cwd, ['rev-parse', '--verify', `${masAntiguo}^`])
}

/** Las lineas ANADIDAS ('+', sin el '+++') del diff de `file` desde `base`. */
async function adiciones(cwd: string, base: string, file: string): Promise<string> {
  const diff = await git(cwd, ['diff', base, '--', file])
  return (diff ?? '').split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n')
}

/**
 * Ficheros del fix de `findingId` (ventana del foco) cuyas ADICIONES contienen el
 * marcador: nacio CON el arreglo, no preexistia. Para inferir `evidencia.file`
 * cuando el analista lo omitio (P2). Vacio si no hay base, marcador vacio o git falla.
 */
export async function ficherosConMarcadorNacidoGit(cwd: string, findingId: string, marcador: string): Promise<readonly string[]> { // prettier-ignore
  if (marcador.trim() === '') return []
  const base = await baseDelFocoGit(cwd, findingId)
  if (base === null) return []
  const lista = (await git(cwd, ['diff', '--name-only', base])) ?? ''
  const ficheros = lista.split('\n').map((s) => s.trim()).filter((s) => s !== '')
  const conMarcador: string[] = []
  for (const f of ficheros) if ((await adiciones(cwd, base, f)).includes(marcador)) conMarcador.push(f)
  return conMarcador
}
