import { capacidadesDe, type Capacidades } from '@domain/agent/capacidades-del-agente'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { fuentesDeSettings } from '@domain/settings/fuentes-de-settings'
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

// EL CINTURON (137, frontera firmada): sin confianza SOLO fuentes user. HOY no cambia
// nada —.claude/ no trackeado, el worktree nace limpio (medido 136)— pero ADR-107 no es eterno.
// `--model` por PROCESO: en el Motor cada proceso es UN agente (ADR-078, enmienda) — sin el, hereda el del CLI.
const flagsEdicion = (dir: string | null, trusted: boolean): readonly string[] => ['--output-format', 'json', '--mcp-config', grafo(dir), '--strict-mcp-config',
  '--permission-mode', 'acceptEdits', '--allowedTools', TOOLS_EDICION, '--max-turns', String(MAX_TURNS), '--model', MODELO_POR_ROL.generador, ...fuentesDeSettings(trusted)] // prettier-ignore
const flagsLectura = (dir: string | null, rol: RolDeLectura, trusted: boolean): readonly string[] => ['--output-format', 'json', '--mcp-config', grafo(dir), '--strict-mcp-config',
  '--permission-mode', 'default', '--allowedTools', TOOLS_LECTURA, '--model', MODELO_POR_ROL[rol], ...fuentesDeSettings(trusted)] // prettier-ignore
export type RolDeLectura = 'analista' | 'critico' | 'omega'

// ADR-112: `-p` SIN valor — el prompt viaja por stdin y los args caben en
// cualquier SO. Las capacidades se siguen leyendo de los flags, no del texto.
const textoDe = (prompt: Prompt, flags: readonly string[]): string =>
  typeof prompt === 'function' ? prompt(capacidadesDe(flags)) : prompt
const conFlags = (flags: readonly string[]): readonly string[] => ['-p', ...flags]

/** Reanudar la vuelta anterior (ADR-110): responde a la objecion en vez de empezar
 *  de cero. `--fork-session` abre sesion NUEVA desde ese punto (el id cambia en cada
 *  vuelta y se recaptura — medido 2026-10-01 con estos flags y la caja clase A). */
const reanudando = (sesion: string | undefined): readonly string[] =>
  sesion === undefined ? [] : ['--resume', sesion, '--fork-session']

/** Con que se lanza C3: lee y edita, dentro del worktree, y con techo. Dentro
 *  de la caja del CLI (ADR-092, clase A) y con el prompt APARTE (ADR-112). */
export function argsDelGenerador(
  prompt: Prompt,
  worktreePath: string,
  grafoDir: string | null,
  trusted: boolean,
  reanudar?: string
): Result<ConPrompt> {
  const flags = flagsEdicion(grafoDir, trusted)
  const caja = conSandbox([...conFlags(flags), ...reanudando(reanudar)], worktreePath)
  return caja.ok ? ok({ args: caja.value, prompt: textoDe(prompt, flags) }) : caja
}

/** Con que se lanzan los que SOLO LEEN ficheros —analista, critico, OMEGA—: el
 *  mismo array que antes vivia copiado tres veces, y la caja del CLI encima. */
export function argsDeLectura(
  prompt: Prompt,
  cwd: string,
  grafoDir: string | null,
  rol: RolDeLectura,
  trusted: boolean
): Result<ConPrompt> {
  const flags = flagsLectura(grafoDir, rol, trusted)
  const caja = conSandbox(conFlags(flags), cwd)
  return caja.ok ? ok({ args: caja.value, prompt: textoDe(prompt, flags) }) : caja
}
