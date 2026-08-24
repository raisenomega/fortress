import { spawn } from 'child_process'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { argsDelGenerador } from './generator-args'
import { relojDeCorrida } from './reloj-de-corrida'
import { desenlaceDelGenerador } from './generator-outcome'
import { trackChild } from '../claude-code/child-registry'

/** El plazo, sacado del dato: las corridas que TERMINARON tardaron entre 205 y
 *  709 s, asi que 900 deja margen sobre la peor sin premiar a la que divaga. */
const TIMEOUT_MS = 15 * 60 * 1000

export type GeneratorResult =
  | { ok: true; runMeta: AnalystRunMeta }
  /** `turnosAgotados` y `timedOut` viajan DESDE AQUI porque solo aqui se sabe:
   *  quien lee la salida despues no puede distinguir su reloj del ajeno. */
  // prettier-ignore
  | { ok: false; error: string; turnosAgotados?: true; timedOut?: true; noArranco?: true; runMeta: AnalystRunMeta }

export interface GraphGenerator {
  generate(worktreePath: string, prompt: string): Promise<GeneratorResult>
}

/**
 * C3 — el UNICO agente del motor que EDITA, y solo dentro del worktree (cwd
 * anclado). Replica el patron de graph-analyst a proposito: preferimos
 * duplicacion controlada a acoplar el analista al generador. Los archivos
 * tocados NO se le creen al agente: los lee el motor con git, despues.
 */
// prettier-ignore
export function createGraphGenerator(claudeBin: string, projectId: string, timeoutMs = TIMEOUT_MS): GraphGenerator {
  return {
    generate: (worktreePath, prompt) => {
      const { sinFactura, meta } = relojDeCorrida(Date.now())
      return new Promise((resolve) => {
        const child = spawn(claudeBin, [...argsDelGenerador(prompt)], { cwd: worktreePath })
        trackChild(child, projectId)
        let out = ''
        // SIGKILL sin gracia (OMEGA da tres segundos; este EDITA, y esos tres
        // segundos son ediciones). Y sin factura, no con una de ceros: el libro
        // mayor distingue "no la pude leer" de "salio gratis" por ese undefined.
        const timer = setTimeout(() => {
          child.kill('SIGKILL')
          resolve({ ok: false, timedOut: true, error: `timeout tras ${Math.round(timeoutMs / 60000)} min`, runMeta: sinFactura() }) // prettier-ignore
        }, timeoutMs)
        child.stdout.on('data', (d: Buffer) => (out += d.toString()))
        child.on('close', (code) => {
          clearTimeout(timer)
          const fin = desenlaceDelGenerador(out, code)
          if (fin.ok) resolve({ ok: true, runMeta: meta(fin.usage) })
          else resolve({ ...fin, error: fin.error, runMeta: meta(fin.usage) })
        })
        child.on('error', (error) => {
          clearTimeout(timer)
          // El proceso jamas existio: ni facturo nada ni es del proveedor.
          resolve({ ok: false, noArranco: true, error: error.message, runMeta: sinFactura() })
        })
      })
    }
  }
}
