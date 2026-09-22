import { spawnSync } from 'child_process'
import { conSandbox } from '../src/infrastructure/sandbox/con-sandbox.ts'

export interface Respuesta {
  readonly clasificados: readonly {
    id: string
    tipo?: unknown
    simbolo?: unknown
    gemela?: unknown
  }[]
  readonly coste: number
}

/**
 * Una llamada a `claude -p` en modo plan sobre el proyecto auditado, DENTRO de la
 * caja del CLI (ADR-092): lee el repo del cliente para decidir el simbolo y la
 * gemela, y nada mas. Sin caja no se lanza. Devuelve el ultimo bloque JSON.
 */
export function preguntarAlAgente(prompt: string, proyectoPath: string): Respuesta {
  const base = ['-p', prompt, '--output-format', 'json', '--permission-mode', 'plan']
  const args = conSandbox(base, proyectoPath)
  if (!args.ok) throw new Error(`sin caja: ${args.error}`)
  const salida = spawnSync('claude', [...args.value], { cwd: proyectoPath, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) // prettier-ignore
  if (salida.status !== 0) throw new Error(`el clasificador salio con ${salida.status}: ${salida.stderr.slice(0, 300)}`) // prettier-ignore
  const res = JSON.parse(salida.stdout) as { result?: string; total_cost_usd?: number }
  const bloques = [...(res.result ?? '').matchAll(/```json\s*([\s\S]*?)```/g)]
  const ultimo = bloques.at(-1)
  if (ultimo === undefined) throw new Error('el clasificador no devolvio bloque json')
  const crudo = JSON.parse(ultimo[1]) as { clasificados?: Respuesta['clasificados'] }
  return { clasificados: crudo.clasificados ?? [], coste: res.total_cost_usd ?? 0 }
}
