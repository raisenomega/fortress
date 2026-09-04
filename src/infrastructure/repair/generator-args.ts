import { TOOLS_EDICION } from './motor-tools'
const GRAPH = JSON.stringify({
  mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp', args: [] } }
})

// Lectura (grafo + Read/Grep/Glob) MAS edicion (Edit/Write). SIN Bash: el
// generador no corre git ni tests; el commit y el gate son del motor.

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

/** Con que se lanza C3: solo lee y edita, dentro del worktree, y con techo. */
export function argsDelGenerador(prompt: string): readonly string[] {
  return ['-p', prompt, '--output-format', 'json', '--mcp-config', GRAPH,
    '--strict-mcp-config', '--permission-mode', 'acceptEdits', '--allowedTools', TOOLS_EDICION,
    '--max-turns', String(MAX_TURNS)] // prettier-ignore
}
