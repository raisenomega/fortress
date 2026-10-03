import { execFileSync, spawnSync } from 'child_process'
import { GRAPH_BIN, GRAPH_MCP_VERSION } from '@domain/connectors/graph-mcp'

/** La version del binario en el PATH, o null si no esta o no responde a `--version`. */
export function versionDelBinario(): string | null {
  const r = spawnSync(GRAPH_BIN, ['--version'], { encoding: 'utf8', timeout: 10_000 })
  return r.status === 0 ? (/(\d+\.\d+\.\d+)/.exec(r.stdout)?.[1] ?? null) : null
}

/**
 * Asegura en PATH el binario del grafo en la version fijada. Que exista no basta:
 * otra version, una vieja o una plantada delante en el PATH no se dan por buenas.
 * Si falta o no coincide, lo instala pineado (npm i -g) y vuelve a medir: si lo que
 * responde sigue sin ser la fijada, falla con el motivo en vez de seguir a ciegas.
 * El install va con --ignore-scripts (ADR-111): ningun postinstall del paquete ni de
 * sus dependencias corre con el entorno del operador; si el paquete dependiera de
 * uno, la re-medicion lo convierte en fallo con motivo, no en binario mudo.
 * Es lo que hace que el spawn headless conecte: el binario, no npx (que falla el
 * handshake). En una maquina que ya tiene la fijada, es un no-op.
 */
export function ensureGraphBinary(log: (line: string) => void): void {
  const previa = versionDelBinario()
  if (previa === GRAPH_MCP_VERSION) {
    log(`Binario codebase-memory-mcp ${previa} ya presente.\n`)
    return
  }
  log(
    previa === null
      ? 'Instalando codebase-memory-mcp (una vez)...\n'
      : `codebase-memory-mcp ${previa} no es la fijada ${GRAPH_MCP_VERSION}: reinstalando...\n`
  )
  execFileSync(
    'npm',
    ['install', '-g', `codebase-memory-mcp@${GRAPH_MCP_VERSION}`, '--ignore-scripts'],
    { stdio: ['ignore', 'ignore', 'pipe'], timeout: 180_000 }
  )
  const instalada = versionDelBinario()
  if (instalada !== GRAPH_MCP_VERSION) {
    throw new Error(
      `Tras instalar, ${GRAPH_BIN} en PATH responde ${instalada ?? 'nada'} y no ${GRAPH_MCP_VERSION}: revisa que binario lo precede en el PATH`
    )
  }
  log(`Binario codebase-memory-mcp ${instalada} instalado.\n`)
}
