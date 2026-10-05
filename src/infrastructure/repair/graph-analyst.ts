import { argsDeLectura, type Prompt } from './generator-args'
import { spawn } from 'child_process'
import { buildEnv } from '../claude-code/build-env'
import { escribirPrompt } from '../claude-code/prompt-por-stdin'
import type { Capacidades } from '@domain/agent/capacidades-del-agente'
import { buildAnalysisPrompt } from '@domain/repair/analysis-prompt'
import { graphSlug } from '@domain/graph/graph-slug'
import { discoverCorpus } from '../project/discover-corpus'
import { readCognitionLog } from '../cognition/read-cognition-log'
import type { Analyst } from '@domain/repair/analysis'
import { noSeDejoLeer } from '@domain/repair/analysis-ilegible'
import { toAnalysis, type RunOut } from './parse-analysis'
import { salidaDelAnalista } from './salida-del-analista'
import { sinRespuesta } from '@domain/repair/falla-del-proveedor'
import { relojDeCorrida } from './reloj-de-corrida'
import { trackChild } from '../claude-code/child-registry'
import { prepararGrafoDelTurno } from '../graph/grafo-del-turno'

/** `buildEnv(null)` como sus hermanos: recorta la SESION VIVA del operador (era el unico spawn que no lo hacia). */
async function run(bin: string, cwd: string, prompt: Prompt, owner: string): Promise<RunOut> {
  // Prompt por STDIN (ADR-112). Solo lectura; sin caja no arranca. `grafo`: el store del turno.
  const grafo = await prepararGrafoDelTurno(cwd)
  const args = argsDeLectura(prompt, cwd, grafo.dir, 'analista')
  if (!args.ok) return (grafo.liberar(), { result: args.error, noArranco: true })
  return new Promise((resolve) => {
    const child = spawn(bin, [...args.value.args], { cwd, env: buildEnv(null) })
    escribirPrompt(child.stdin, args.value.prompt)
    trackChild(child, owner)
    let out = ''
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.on('close', () => {
      grafo.liberar()
      // El 429 se mira ANTES de dar el texto por analisis (la rafaga del 05-oct).
      resolve(salidaDelAnalista(out))
    })
    // Antes resolvia con una cadena vacia, indistinguible de un CLI que corrio
    // y no dijo nada: el expediente acababa juzgando una respuesta inexistente.
    child.on(
      'error',
      (error) => (grafo.liberar(), resolve({ result: error.message, noArranco: true }))
    )
  })
}

/** Analista real: claude -p GRAFO-PRIMERO (read-only) con su factura. tokensUsed
 *  va undefined si el parser no lo saco. El agentRunId lo pone quien asienta. */
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
      const analysis = out.proveedor === undefined ? toAnalysis(target, out) : sinRespuesta(target, out.proveedor) // prettier-ignore
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
