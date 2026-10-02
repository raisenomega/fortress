import { capacidadesDe, type Capacidades } from '@domain/agent/capacidades-del-agente'
import { entradaDelGrafo, GRAPH_SERVER } from '@domain/connectors/graph-mcp'
import type { Result } from '@domain/shared/result'
import { conSandbox } from '../sandbox/con-sandbox'
import { TOOLS_EDICION, TOOLS_LECTURA } from './motor-tools'
import { MAX_TURNS } from './techo-de-turnos'
// El mismo servidor que `withGraph`, con la misma palanca: el GRAPH del motor era
// el segundo camino al grafo, y sin esto el aislamiento quedaba medio hecho.
const grafo = (dir: string | null): string => JSON.stringify({ mcpServers: { [GRAPH_SERVER]: entradaDelGrafo(dir) } }) // prettier-ignore

// Lectura (grafo + Read/Grep/Glob) MAS edicion (Edit/Write). Bash NO va en la
// lista y NO por eso falta: el allowlist solo pre-aprueba, y los cuatro agentes
// lo tienen (medido en vivo el 2026-09-21). No se quita a proposito —seria un
// freno (ADR-090 §0)— y la caja lo contiene (ADR-092). El commit y el gate
// siguen siendo del motor, no del agente.

/**
 * El prompt, o quien lo construye a partir de lo que el lanzamiento PUEDE. Un
 * constructor recibe las capacidades leidas de las mismas flags que se lanzan:
 * asi el texto no puede desincronizarse de los args, por construccion.
 */
export type Prompt = string | ((c: Capacidades) => string)

const flagsEdicion = (dir: string | null): readonly string[] => ['--output-format', 'json', '--mcp-config', grafo(dir), '--strict-mcp-config',
  '--permission-mode', 'acceptEdits', '--allowedTools', TOOLS_EDICION, '--max-turns', String(MAX_TURNS)] // prettier-ignore
const flagsLectura = (dir: string | null): readonly string[] => ['--output-format', 'json', '--mcp-config', grafo(dir), '--strict-mcp-config',
  '--permission-mode', 'default', '--allowedTools', TOOLS_LECTURA] // prettier-ignore

const conFlags = (prompt: Prompt, flags: readonly string[]): readonly string[] => [
  '-p',
  typeof prompt === 'function' ? prompt(capacidadesDe(flags)) : prompt,
  ...flags
]

/**
 * Reanudar la sesion de la vuelta anterior (ADR-110): el generador responde a la
 * objecion en vez de empezar de cero. `--fork-session` deja intacta la sesion
 * original y abre una NUEVA desde ese punto, asi que el id cambia en cada vuelta
 * y hay que recapturarlo — medido el 2026-10-01, junto con que `--resume`
 * funciona con estos mismos flags y la caja clase A puesta.
 */
const reanudando = (sesion: string | undefined): readonly string[] =>
  sesion === undefined ? [] : ['--resume', sesion, '--fork-session']

/** Con que se lanza C3: lee y edita, dentro del worktree, y con techo.
 *  Y dentro de la caja del CLI (ADR-092, clase A): sin caja, no hay args. */
export function argsDelGenerador(
  prompt: Prompt,
  worktreePath: string,
  grafoDir: string | null,
  reanudar?: string
): Result<readonly string[]> {
  const args = [...conFlags(prompt, flagsEdicion(grafoDir)), ...reanudando(reanudar)]
  return conSandbox(args, worktreePath)
}

/** Con que se lanzan los que SOLO LEEN ficheros —analista, critico, OMEGA—: el
 *  mismo array que antes vivia copiado tres veces, y la caja del CLI encima. */
export function argsDeLectura(
  prompt: Prompt,
  cwd: string,
  grafoDir: string | null
): Result<readonly string[]> {
  return conSandbox(conFlags(prompt, flagsLectura(grafoDir)), cwd)
}
