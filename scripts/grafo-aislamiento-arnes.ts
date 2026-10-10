import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GRAPH_BIN } from '../src/domain/connectors/graph-mcp.ts'

export interface Crudo {
  readonly rc: number
  readonly stdout: string
  readonly stderr: string
}

export function raizTemporal(): string {
  return mkdtempSync(join(tmpdir(), 'grafo-aislamiento-'))
}

/** Un repo git minimo con un simbolo marcado, para que el grafo indexe algo. */
export function repoTiny(raiz: string, nombre: string, simbolo: string): string {
  const dir = join(raiz, nombre)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.ts'), `export function ${simbolo}(): number { return 1 }\n`)
  execFileSync('git', ['init', '-q'], { cwd: dir })
  execFileSync('git', ['add', '-A'], { cwd: dir })
  execFileSync('git', ['-c', 'user.email=a@b.c', '-c', 'user.name=t', 'commit', '-qm', 'x'], { cwd: dir }) // prettier-ignore
  return dir
}

/** El binario en modo cli con un CBM_CACHE_DIR dado; crudo (rc + stdout + stderr). */
export function correrCrudo(
  cacheDir: string,
  tool: string,
  args: Record<string, unknown>,
  cwd?: string
): Crudo {
  const env = { ...process.env, CBM_CACHE_DIR: cacheDir }
  const r = spawnSync(GRAPH_BIN, ['cli', tool], { env, cwd, input: JSON.stringify(args), encoding: 'utf8', timeout: 600000 }) // prettier-ignore
  return { rc: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

/** Copia SOLO el .db de `slug` al fence: un unico proyecto visible (el del turno). */
export function copiarAlFence(cacheReal: string, fence: string, slug: string): void {
  mkdirSync(fence, { recursive: true })
  copyFileSync(join(cacheReal, `${slug}.db`), join(fence, `${slug}.db`))
}
