import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  GRAPH_BIN,
  GRAPH_MCP_VERSION,
  HERRAMIENTAS_DEL_SERVIDOR
} from '@domain/connectors/graph-mcp'

/** La version del binario en el PATH, o null si no esta. */
function versionInstalada(): string | null {
  const r = spawnSync(GRAPH_BIN, ['--version'], { encoding: 'utf8', timeout: 10_000 })
  return r.status === 0 ? (/(\d+\.\d+\.\d+)/.exec(r.stdout)?.[1] ?? null) : null
}

/**
 * El servidor, al arrancar por stdio, pone un vigilante sobre su cwd y REINDEXA
 * el proyecto si ya estaba en la cache (medido el 2026-09-24: cada gate
 * reindexaba FORTRESS en la cache real del operador). Se le da un cwd vacio y un
 * HOME propio: no hay proyecto que vigilar ni cache real que tocar.
 */
function aislado(): { readonly cwd: string; readonly env: NodeJS.ProcessEnv } {
  const home = mkdtempSync(join(tmpdir(), 'grafo-test-'))
  return { cwd: home, env: { ...process.env, HOME: home, XDG_CACHE_HOME: join(home, '.cache') } }
}

/** `tools/list` por stdio, como lo hace el CLI: lo que el servidor EXPONE hoy. */
function herramientasReales(): readonly string[] {
  const linea = (m: object): string => `${JSON.stringify(m)}\n`
  const entrada =
    linea({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'fortress-test', version: '0' } } }) + // prettier-ignore
    linea({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) +
    linea({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
  const r = spawnSync(GRAPH_BIN, [], { input: entrada, encoding: 'utf8', timeout: 30_000, ...aislado() }) // prettier-ignore
  for (const l of r.stdout.split('\n')) {
    try {
      const m = JSON.parse(l) as { id?: number; result?: { tools?: { name: string }[] } }
      if (m.id === 2) return (m.result?.tools ?? []).map((t) => t.name).sort()
    } catch {
      /* linea que no es JSON: se ignora */
    }
  }
  throw new Error(`sin tools/list: ${r.stdout.slice(0, 200)} ${r.stderr.slice(0, 200)}`)
}

const instalada = versionInstalada()
const esLaFijada = instalada === GRAPH_MCP_VERSION

/**
 * La lista fijada es la fuente ESTABLE (no depende de que haya binario en la
 * maquina que corre los tests); este test la cruza con el binario REAL cuando
 * esta instalado en la version fijada. Si no lo esta, lo dice y no finge.
 */
describe(`el vocabulario coincide con el servidor instalado (fijado ${GRAPH_MCP_VERSION}, instalado ${instalada ?? 'ninguno'})`, () => {
  it.skipIf(!esLaFijada)('tools/list del binario == HERRAMIENTAS_DEL_SERVIDOR', () => {
    expect(herramientasReales()).toEqual([...HERRAMIENTAS_DEL_SERVIDOR].sort())
  })
})
