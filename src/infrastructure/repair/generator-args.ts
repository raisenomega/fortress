import { capacidadesDe, type Capacidades } from '@domain/agent/capacidades-del-agente'
import type { Result } from '@domain/shared/result'
import { conSandbox } from '../sandbox/con-sandbox'
import { TOOLS_EDICION, TOOLS_LECTURA } from './motor-tools'
const GRAPH = JSON.stringify({
  mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp', args: [] } }
})

// Lectura (grafo + Read/Grep/Glob) MAS edicion (Edit/Write). Bash NO va en la
// lista y NO por eso falta: el allowlist solo pre-aprueba, y los cuatro agentes
// lo tienen (medido en vivo el 2026-09-21). No se quita a proposito —seria un
// freno (ADR-090 §0)— y la caja lo contiene (ADR-092). El commit y el gate
// siguen siendo del motor, no del agente.

/**
 * Techo de turnos del generador.
 *
 * Sale de los datos, no de una intuicion: las corridas que COMPLETARON el fix
 * dieron entre 4 y 25 vueltas; las cuatro que reventaron el tope dieron 32, 35,
 * 44 y 50. La separacion es limpia, y 30 deja cinco vueltas de margen sobre la
 * peor que termino sin llegar a la mas barata de las que divagaron.
 *
 * El techo no es solo un freno de coste: cada vuelta relee la transcripcion
 * entera, asi que los turnos son lo que inflaba la re-lectura que el tope
 * contaba. Las dos deudas atacaban el mismo problema por los dos lados.
 *
 * El analista NO lo lleva, a proposito: sus vueltas no distinguen a las que
 * completan (15-25) de las que revientan (18-25), y un analisis truncado sale
 * como JSON a medias, que el motor archiva como "ilegible" y acaba en CADUCADO.
 * Poner el techo ahi fabricaria justo esa mentira.
 */
export const MAX_TURNS = 30

/**
 * El prompt, o quien lo construye a partir de lo que el lanzamiento PUEDE. Un
 * constructor recibe las capacidades leidas de las mismas flags que se lanzan:
 * asi el texto no puede desincronizarse de los args, por construccion.
 */
export type Prompt = string | ((c: Capacidades) => string)

const FLAGS_EDICION = ['--output-format', 'json', '--mcp-config', GRAPH, '--strict-mcp-config',
  '--permission-mode', 'acceptEdits', '--allowedTools', TOOLS_EDICION, '--max-turns', String(MAX_TURNS)] // prettier-ignore
const FLAGS_LECTURA = ['--output-format', 'json', '--mcp-config', GRAPH, '--strict-mcp-config',
  '--permission-mode', 'default', '--allowedTools', TOOLS_LECTURA] // prettier-ignore

const conFlags = (prompt: Prompt, flags: readonly string[]): readonly string[] => [
  '-p',
  typeof prompt === 'function' ? prompt(capacidadesDe(flags)) : prompt,
  ...flags
]

/** Con que se lanza C3: lee y edita, dentro del worktree, y con techo.
 *  Y dentro de la caja del CLI (ADR-092, clase A): sin caja, no hay args. */
export function argsDelGenerador(prompt: Prompt, worktreePath: string): Result<readonly string[]> {
  return conSandbox(conFlags(prompt, FLAGS_EDICION), worktreePath)
}

/** Con que se lanzan los que SOLO LEEN ficheros —analista, critico, OMEGA—: el
 *  mismo array que antes vivia copiado tres veces, y la caja del CLI encima. */
export function argsDeLectura(prompt: Prompt, cwd: string): Result<readonly string[]> {
  return conSandbox(conFlags(prompt, FLAGS_LECTURA), cwd)
}
