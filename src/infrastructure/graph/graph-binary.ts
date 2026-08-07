import { execFileSync } from 'child_process'
import { GRAPH_BIN, GRAPH_MCP_VERSION } from '@domain/connectors/graph-mcp'

function installed(): boolean {
  try {
    execFileSync('which', [GRAPH_BIN], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Asegura el binario del grafo en PATH. Si falta, lo instala pineado (npm i -g).
 * Es lo que hace que el spawn headless conecte: el binario, no npx (que falla el
 * handshake). En una maquina que ya lo tiene, es un no-op instantaneo.
 */
export function ensureGraphBinary(log: (line: string) => void): void {
  if (installed()) {
    log('Binario codebase-memory-mcp ya presente.\n')
    return
  }
  log('Instalando codebase-memory-mcp (una vez)...\n')
  execFileSync('npm', ['install', '-g', `codebase-memory-mcp@${GRAPH_MCP_VERSION}`], {
    stdio: 'ignore',
    timeout: 180_000
  })
  log('Binario instalado.\n')
}
