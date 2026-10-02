import { spawn } from 'child_process'
import { argsDelGenerador } from './generator-args'
import type { GraphGenerator } from './graph-generator-types'
import { relojDeCorrida } from './reloj-de-corrida'
import { desenlaceDelGenerador } from './generator-outcome'
import { trackChild } from '../claude-code/child-registry'
import { grafoDelTurnoDe, type GrafoDelTurnoPort } from '../graph/grafo-del-turno'
import { buildEnv } from '../claude-code/build-env'

/** El plazo, sacado del dato: las corridas que TERMINARON tardaron entre 205 y
 *  709 s, asi que 900 deja margen sobre la peor sin premiar a la que divaga. */
const TIMEOUT_MS = 15 * 60 * 1000

/**
 * C3 — el UNICO agente del motor que EDITA, y solo dentro del worktree (cwd
 * anclado). Replica el patron de graph-analyst a proposito: preferimos
 * duplicacion controlada a acoplar el analista al generador. Los archivos
 * tocados NO se le creen al agente: los lee el motor con git, despues.
 */
// prettier-ignore
// `grafo` es el store del turno (ADR-095, enmienda), atado al proyecto por quien crea
// el generador; sin atar, un directorio vacio: nunca la cache real.
export function createGraphGenerator(claudeBin: string, projectId: string, timeoutMs = TIMEOUT_MS, grafo: GrafoDelTurnoPort = grafoDelTurnoDe(null)): GraphGenerator { // prettier-ignore
  return {
    generate: async (worktreePath, prompt, reanudar) => {
      const { sinFactura, meta } = relojDeCorrida(Date.now())
      const store = await grafo.preparar()
      const args = argsDelGenerador(prompt, worktreePath, store.dir, reanudar)
      // Sin caja no arranca: el mismo camino que un binario que no existe.
      if (!args.ok) return (store.liberar(), { ok: false, noArranco: true, error: args.error, runMeta: sinFactura() }) // prettier-ignore
      return new Promise((resolve) => {
        // El mismo recorte que los demas lanzamientos del CLI: este es el que
        // EDITA, con prompt del repo AJENO y un MCP nieto que hereda esto, asi
        // que la sesion viva del operador no baja. `null` = sin key propia: se
        // sigue facturando por donde ya se facturaba (login OAuth bajo HOME).
        const env = buildEnv(null)
        const child = spawn(claudeBin, [...args.value], { cwd: worktreePath, env })
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
          store.liberar()
          const fin = desenlaceDelGenerador(out, code)
          if (fin.ok) resolve({ ok: true, runMeta: meta(fin.usage), sesion: fin.sesion })
          else resolve({ ...fin, error: fin.error, runMeta: meta(fin.usage), sesion: fin.sesion })
        })
        child.on('error', (error) => {
          clearTimeout(timer)
          store.liberar()
          // El proceso jamas existio: ni facturo nada ni es del proveedor.
          resolve({ ok: false, noArranco: true, error: error.message, runMeta: sinFactura() })
        })
      })
    }
  }
}

export type { GeneratorResult, GraphGenerator } from './graph-generator-types'
