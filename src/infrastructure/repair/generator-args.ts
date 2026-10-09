import { capacidadesDe, type Capacidades } from '@domain/agent/capacidades-del-agente'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { entradaDelGrafo, GRAPH_SERVER } from '@domain/connectors/graph-mcp'
import { ok, type Result } from '@domain/shared/result'
import type { ConPrompt } from '../claude-code/prompt-por-stdin'
import { conSandbox } from '../sandbox/con-sandbox'
import { TOOLS_EDICION, TOOLS_LECTURA } from './motor-tools'
import { MAX_TURNS } from './techo-de-turnos'
// El mismo servidor que `withGraph`, con la misma palanca: el GRAPH del motor era
// el segundo camino al grafo, y sin esto el aislamiento quedaba medio hecho.
const grafo = (dir: string | null): string => JSON.stringify({ mcpServers: { [GRAPH_SERVER]: entradaDelGrafo(dir) } }) // prettier-ignore

// Lectura (grafo + Read/Grep/Glob) MAS edicion MAS la forma segura de npm (ADR-111):
// en headless todo npm se negaba (medido 02-oct). Bash no se niega a proposito
// (ADR-090 §0) y la caja lo contiene (ADR-092). El commit y el gate siguen del motor.

/**
 * El prompt, o quien lo construye a partir de lo que el lanzamiento PUEDE. Un
 * constructor recibe las capacidades leidas de las mismas flags que se lanzan:
 * asi el texto no puede desincronizarse de los args, por construccion.
 */
export type Prompt = string | ((c: Capacidades) => string)

// SIN `--setting-sources` A PROPOSITO: el Motor corre SOLO sobre FORTRESS (ADR-107),
// y las fuentes de proyecto son DELIBERADAS — el hook de ADR-098 (bloquea Edit sobre
// .claude/) vive en ellas y quitarlas lo desarmaria. En repo ajeno ese flag seria
// obligatorio (fuentes-de-settings, el CRITICAL 351abcd1); aqui el repo es el propio.
// `--model` por PROCESO: en el Motor cada proceso es UN agente (ADR-078, enmienda) — sin el, hereda el del CLI.
const flagsEdicion = (dir: string | null): readonly string[] => ['--output-format', 'json', '--mcp-config', grafo(dir), '--strict-mcp-config',
  '--permission-mode', 'acceptEdits', '--allowedTools', TOOLS_EDICION, '--max-turns', String(MAX_TURNS), '--model', MODELO_POR_ROL.generador] // prettier-ignore
const flagsLectura = (dir: string | null, rol: RolDeLectura): readonly string[] => ['--output-format', 'json', '--mcp-config', grafo(dir), '--strict-mcp-config',
  '--permission-mode', 'default', '--allowedTools', TOOLS_LECTURA, '--model', MODELO_POR_ROL[rol]] // prettier-ignore
export type RolDeLectura = 'analista' | 'critico' | 'omega'

// ADR-112: `-p` SIN valor — el prompt viaja por stdin y los args caben en
// cualquier SO. Las capacidades se siguen leyendo de los flags, no del texto.
const textoDe = (prompt: Prompt, flags: readonly string[]): string =>
  typeof prompt === 'function' ? prompt(capacidadesDe(flags)) : prompt
const conFlags = (flags: readonly string[]): readonly string[] => ['-p', ...flags]

/**
 * Reanudar la sesion de la vuelta anterior (ADR-110): el generador responde a la
 * objecion en vez de empezar de cero. `--fork-session` deja intacta la sesion
 * original y abre una NUEVA desde ese punto, asi que el id cambia en cada vuelta
 * y hay que recapturarlo — medido el 2026-10-01, junto con que `--resume`
 * funciona con estos mismos flags y la caja clase A puesta.
 */
const reanudando = (sesion: string | undefined): readonly string[] =>
  sesion === undefined ? [] : ['--resume', sesion, '--fork-session']

/** Con que se lanza C3: lee y edita, dentro del worktree, y con techo. Dentro
 *  de la caja del CLI (ADR-092, clase A) y con el prompt APARTE (ADR-112). */
export function argsDelGenerador(
  prompt: Prompt,
  worktreePath: string,
  grafoDir: string | null,
  reanudar?: string
): Result<ConPrompt> {
  const flags = flagsEdicion(grafoDir)
  const caja = conSandbox([...conFlags(flags), ...reanudando(reanudar)], worktreePath)
  return caja.ok ? ok({ args: caja.value, prompt: textoDe(prompt, flags) }) : caja
}

/** Con que se lanzan los que SOLO LEEN ficheros —analista, critico, OMEGA—: el
 *  mismo array que antes vivia copiado tres veces, y la caja del CLI encima. */
export function argsDeLectura(
  prompt: Prompt,
  cwd: string,
  grafoDir: string | null,
  rol: RolDeLectura
): Result<ConPrompt> {
  const flags = flagsLectura(grafoDir, rol)
  const caja = conSandbox(conFlags(flags), cwd)
  return caja.ok ? ok({ args: caja.value, prompt: textoDe(prompt, flags) }) : caja
}
