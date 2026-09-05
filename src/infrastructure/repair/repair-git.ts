import { spawn } from 'child_process'
import { gitEnv } from '../git/git-env'

export interface GitOut {
  readonly code: number
  readonly out: string
}

/** git con args en array, jamas shell strings. stdout+stderr juntos para autopsia. */
export function git(cwd: string, args: readonly string[]): Promise<GitOut> {
  return new Promise((resolve) => {
    const child = spawn('git', args as string[], { cwd, env: gitEnv() })
    let out = ''
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.stderr.on('data', (d: Buffer) => (out += d.toString()))
    child.on('close', (code) => resolve({ code: code ?? 1, out }))
    child.on('error', (error) => resolve({ code: 1, out: error.message }))
  })
}

/** La ultima linea con contenido: el error legible, no el volcado entero. */
export function lastLine(out: string): string {
  const lines = out.split('\n').filter((line) => line.trim() !== '')
  return lines[lines.length - 1] ?? 'sin salida'
}

/** Archivos del `status --porcelain`, renombres incluidos (se queda el destino). */
export function porcelainFiles(out: string): string[] {
  return out
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const path = line.slice(3)
      const arrow = path.indexOf(' -> ')
      return arrow === -1 ? path : path.slice(arrow + 4)
    })
}

/** "2 files changed, 10 insertions(+), 3 deletions(-)" -> numeros, 0 si faltan. */
export function shortstat(out: string): { insertions: number; deletions: number } {
  return {
    insertions: Number(/(\d+) insertion/.exec(out)?.[1] ?? 0),
    deletions: Number(/(\d+) deletion/.exec(out)?.[1] ?? 0)
  }
}

/**
 * La rama del worktree, preguntada al propio worktree: una llamada, sin parsear
 * la lista global. Hay que leerla ANTES de borrarlo, que despues ya no existe.
 *
 * Solo se devuelve si es del motor. Un worktree en HEAD suelto responde `HEAD`,
 * y el checkout vivo responderia `main`: pasar cualquiera de los dos a un
 * `branch -D` seria borrar la rama de trabajo de otro. Vacio significa "esta no
 * es mia y no se toca".
 */
export async function ramaDelMotor(worktreePath: string): Promise<string> {
  const { code, out } = await git(worktreePath, ['rev-parse', '--abbrev-ref', 'HEAD'])
  const rama = out.trim()
  return code === 0 && rama.startsWith('repair/') ? rama : ''
}
