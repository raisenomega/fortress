import { spawn } from 'child_process'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { buildEnv } from '../claude-code/build-env'
import { escribirPrompt } from '../claude-code/prompt-por-stdin'
import { trackChild } from '../claude-code/child-registry'
import { senalAl } from '../claude-code/kill-signal'
import { argsDeLectura } from './generator-args'
import { grafoDelTurnoDe, type GrafoDelTurnoPort } from '../graph/grafo-del-turno'
import { salidaDelJuez } from './salida-del-juez'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { relojDeCorrida } from './reloj-de-corrida'

const TIMEOUT_MS = 900_000

/** Lo que deja una corrida del critico. Sin `ok` no hubo objecion que leer. */
export type CriticoRunResult = { ok: true; texto: string; runMeta: AnalystRunMeta } | { ok: false; error: string; timedOut: boolean; runMeta: AnalystRunMeta } // prettier-ignore

export interface GraphCritico {
  run(arbol: string, prompt: string): Promise<CriticoRunResult>
}

/** El critico real: `claude -p` sobre el arbol, MISMAS herramientas que OMEGA;
 *  la diferencia vive entera en el prompt. REPLICA el ciclo de `graph-omega` sin
 *  reusarlo (atacante y juez no comparten codigo); si reusa `processOmegaOut`.
 *  `grafo`: store del turno (ADR-095, enmienda); sin atar, dir vacio, nunca la cache. */
export function createGraphCritico(
  claudeBin: string,
  projectId: string,
  trusted: boolean,
  timeoutMs = TIMEOUT_MS,
  grafo: GrafoDelTurnoPort = grafoDelTurnoDe(null)
): GraphCritico {
  // prettier-ignore
  return {
    run: async (arbol, prompt) => {
      const { sinFactura, meta } = relojDeCorrida(Date.now())
      const store = await grafo.preparar() // sin caja no arranca, como un binario que no existe:
      const args = argsDeLectura(prompt, arbol, store.dir, 'critico', trusted)
      if (!args.ok) return (store.liberar(), { ok: false, error: args.error, timedOut: false, runMeta: sinFactura() }) // prettier-ignore
      return new Promise((resolve) => {
        const child = spawn(claudeBin, [...args.value.args], { cwd: arbol, detached: true, env: buildEnv(null) })
        escribirPrompt(child.stdin, args.value.prompt) // ADR-112
        trackChild(child, projectId, 'grupo') // por GRUPO: o Detener mata al lider y el MCP sigue vivo
        let out = ''
        let timedOut = false
        const timer = setTimeout(() => {
          timedOut = true
          senalAl(child, 'SIGTERM', 'grupo')
          const escalation = setTimeout(() => senalAl(child, 'SIGKILL', 'grupo'), 3000)
          escalation.unref()
          child.once('close', () => clearTimeout(escalation))
        }, timeoutMs)
        child.stdout.on('data', (d: Buffer) => (out += d.toString()))
        child.on('close', () => {
          clearTimeout(timer)
          store.liberar()
          if (timedOut) return resolve({ ok: false, error: 'timeout', timedOut, runMeta: sinFactura() }) // prettier-ignore -- plazo: sin factura, cero seria mentira
          const { usage, text, juicio, fallo } = salidaDelJuez(out, MODELO_POR_ROL.critico)
          if (fallo !== undefined) return resolve({ ok: false, error: fallo.error, timedOut: false, runMeta: meta(usage, juicio) }) // prettier-ignore
          const texto = text.trim()
          // Sin texto no hay objecion: el turno sigue, con el tribunal mudo.
          if (texto === '') return resolve({ ok: false, error: 'sin texto', timedOut: false, runMeta: meta(usage, juicio) }) // prettier-ignore
          resolve({ ok: true, texto, runMeta: meta(usage, juicio) })
        })
        // El critico no llego a existir: no es su objecion la que fallo.
        child.on('error', (e) => {
          clearTimeout(timer)
          store.liberar()
          resolve({ ok: false, error: e.message, timedOut: false, runMeta: sinFactura() })
        })
      })
    }
  }
}
