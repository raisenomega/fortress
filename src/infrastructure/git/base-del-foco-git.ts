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
