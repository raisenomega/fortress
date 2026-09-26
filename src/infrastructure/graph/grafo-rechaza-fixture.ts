import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect } from 'vitest'
import { CBM_CACHE_DIR, GRAPH_BIN, GRAPH_MCP_VERSION } from '@domain/connectors/graph-mcp'

/** La version del binario en el PATH, o null si no esta: como `grafo-instalado.test.ts`. */
function versionInstalada(): string | null {
  const r = spawnSync(GRAPH_BIN, ['--version'], { encoding: 'utf8', timeout: 10_000 })
  return r.status === 0 ? (/(\d+\.\d+\.\d+)/.exec(r.stdout)?.[1] ?? null) : null
}
export const esLaFijada = versionInstalada() === GRAPH_MCP_VERSION

export interface SalidaDelCli {
  readonly rc: number | null
  readonly out: string
  readonly err: string
}

/** El binario REAL con HOME propio bajo `raiz` (red de seguridad) y el store en `dir`: la cache real ni se mira. */
export function cliAislado(
  raiz: string
): (dir: string, tool: string, args: object) => SalidaDelCli {
  const home = join(raiz, 'home')
  return (dir, tool, args) => {
    const r = spawnSync(GRAPH_BIN, ['cli', tool, JSON.stringify(args)], { encoding: 'utf8', timeout: 90_000, cwd: raiz, env: { ...process.env, HOME: home, [CBM_CACHE_DIR]: dir } }) // prettier-ignore
    return { rc: r.status, out: r.stdout, err: r.stderr }
  }
}

/** Un repo minimo bajo `raiz`, indexado en la cache de mentira `cache`. */
export function repoIndexado(raiz: string, nombre: string, cache: string): string {
  const dir = join(raiz, nombre)
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'src', 'a.ts'), `export function ${nombre}(): number { return 1 }\n`)
  execFileSync('git', ['init', '-q'], { cwd: dir })
  execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '.'], { cwd: dir })
  execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init'], {
    cwd: dir
  })
  expect(cliAislado(raiz)(cache, 'index_repository', { repo_path: dir }).rc).toBe(0)
  return dir
}
