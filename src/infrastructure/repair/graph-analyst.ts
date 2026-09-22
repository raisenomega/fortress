import { argsDeLectura, type Prompt } from './generator-args'
import { spawn } from 'child_process'
import { buildEnv } from '../claude-code/build-env'
import type { Capacidades } from '@domain/agent/capacidades-del-agente'
import { buildAnalysisPrompt } from '@domain/repair/analysis-prompt'
import { graphSlug } from '@domain/graph/graph-slug'
import { discoverCorpus } from '../project/discover-corpus'
import { readCognitionLog } from '../cognition/read-cognition-log'
import type { Analyst } from '@domain/repair/analysis'
import { noSeDejoLeer } from '@domain/repair/analysis-ilegible'
import { toAnalysis, type RunOut } from './parse-analysis'
import { parseUsage } from '../claude-code/parse-usage'
import { relojDeCorrida } from './reloj-de-corrida'
import { trackChild } from '../claude-code/child-registry'

/** `buildEnv(null)` como sus dos hermanos del motor: recorta las llaves de la
 *  SESION VIVA del operador. Era el unico spawn de `claude` que no lo hacia, asi
 *  que su hijo —y los MCP nietos— veian el agente ssh y el keyring. */
function run(bin: string, cwd: string, prompt: Prompt, owner: string): Promise<RunOut> {
  // El prompt DEBE ir pegado a -p (si no, otro flag se lo come). --strict-mcp-config
  // aisla el grafo (sin los MCP de claude.ai). Solo tools de lectura: read-only.
  // Sin caja no arranca: el mismo camino que un binario que no existe.
  const args = argsDeLectura(prompt, cwd)
  if (!args.ok) return Promise.resolve({ result: args.error, noArranco: true })
  return new Promise((resolve) => {
    const child = spawn(bin, [...args.value], { cwd, env: buildEnv(null) })
    trackChild(child, owner)
    let out = ''
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.on('close', () => {
      try {
        const j = JSON.parse(out) as Record<string, unknown>
        const texto = typeof j.result === 'string' ? j.result : ''
        resolve({ result: texto, usage: parseUsage(j) })
      } catch {
        // Sin JSON no hay factura: ausente, no cero. Cero diria "gratis".
        resolve({ result: out })
      }
    })
    // Antes resolvia con una cadena vacia, indistinguible de un CLI que corrio
    // y no dijo nada: el expediente acababa juzgando una respuesta inexistente.
    child.on('error', (error) => resolve({ result: error.message, noArranco: true }))
  })
}

/** Analista real: corre claude -p GRAFO-PRIMERO (read-only) y arma el Analysis
 *  con su factura. tokensUsed va undefined si el parser no lo saco: no se
 *  inventan numeros. El agentRunId no se sabe aqui todavia: lo pone quien
 *  asienta la corrida, que es quien recibe el id. */
// prettier-ignore
export function createGraphAnalyst(claudeBin: string, projectPath: string, projectId: string): Analyst {
  return {
    study: async (target, atendidas) => {
      const reloj = relojDeCorrida(Date.now())
      // El corpus y el COGNITION-LOG se leen en cada estudio, no al crear el
      // analista: entre dos propuestas el proyecto puede haber ganado un ADR, y
      // el log se reescribe entero en cada escaneo.
      // Recibe lo que el lanzamiento PUEDE (Bash, edicion) leido de sus flags:
      // el prompt refleja las capacidades reales, no las que alguien creyo.
      const prompt = (c: Capacidades): string => buildAnalysisPrompt(target, discoverCorpus(projectPath), atendidas, graphSlug(projectPath), c, readCognitionLog(projectPath).patterns) // prettier-ignore
      const out = await run(claudeBin, projectPath, prompt, projectId)
      const analysis = toAnalysis(target, out)
      return {
        analysis,
        // El crudo ENTERO solo cuando no se dejo leer: es lo unico con lo que
        // se puede reproducir el fallo, y el asiento guarda solo una muestra.
        ...(noSeDejoLeer(analysis) ? { raw: out.result } : {}),
        runMeta: reloj.meta(out.usage)
      }
    }
  }
}
