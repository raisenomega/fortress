import { execFileSync, spawn } from 'child_process'
import { GRAPH_BIN } from '@domain/connectors/graph-mcp'
import { headSha } from '../git/head-sha'
import { trackChild } from '../claude-code/child-registry'

const TIMEOUT_MS = 10 * 60 * 1000

export type ReindexResult = { ok: true; sha: string } | { ok: false; error: string }

export interface ReindexRunner {
  run(projectPath: string, projectId: string): Promise<ReindexResult>
}

function installed(bin: string): boolean {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** La ultima linea con contenido: el error persistido, no el volcado entero. */
function lastLine(text: string): string {
  const lines = text.split('\n').filter((line) => line.trim() !== '')
  return lines[lines.length - 1] ?? 'sin salida'
}

/**
 * Reindexa DIRECTO contra el binario del grafo (modo `cli`): cero agentes,
 * cero tokens. El HEAD se lee ANTES de spawnear: lo que se persiste es el SHA
 * que el indice realmente vio, no uno que aparezca durante la corrida.
 */
export function createReindexRunner(bin = GRAPH_BIN, timeoutMs = TIMEOUT_MS): ReindexRunner {
  return {
    run: (projectPath, projectId) => {
      if (!installed(bin)) return Promise.resolve({ ok: false, error: `binary not found: ${bin}` })
      const sha = headSha(projectPath)
      if (sha === null) return Promise.resolve({ ok: false, error: 'sin repo git' })

      return new Promise((resolve) => {
        const child = spawn(bin, ['cli', 'index_repository'], { cwd: projectPath })
        trackChild(child, projectId)
        let out = ''
        const timer = setTimeout(() => {
          child.kill()
          resolve({ ok: false, error: `timeout tras ${Math.round(timeoutMs / 60000)} min` })
        }, timeoutMs)
        child.stdout.on('data', (d: Buffer) => (out += d.toString()))
        child.stderr.on('data', (d: Buffer) => (out += d.toString()))
        child.on('close', (code) => {
          clearTimeout(timer)
          if (code === 0) resolve({ ok: true, sha })
          else resolve({ ok: false, error: lastLine(out) })
        })
        child.on('error', (error) => {
          clearTimeout(timer)
          resolve({ ok: false, error: `${projectId}: ${error.message}` })
        })
        child.stdin.write(JSON.stringify({ repo_path: projectPath }))
        child.stdin.end()
      })
    }
  }
}
