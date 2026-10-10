import { spawn } from 'node:child_process'
import { buildEnv } from '../claude-code/build-env'
import { trackChild } from '../claude-code/child-registry'

const TIMEOUT_MS = 30 * 1000

/**
 * Corre UNA tool de LECTURA del binario del grafo en modo `cli` (args por stdin
 * JSON, resultado por stdout LIMPIO). `cacheDir` encierra el store del binario
 * (el fence del turno, ADR-095): el `CBM_CACHE_DIR` que recibe es el unico que
 * alcanza. Devuelve stdout crudo, o null ante timeout / rc!=0 / fallo del
 * spawn: el que llama decide (fail-safe). NO fusiona stderr —ahi van los logs y
 * los errores como `available_projects`—, al reves que el reindexador.
 */
export function correrCliGrafo(
  bin: string,
  cacheDir: string,
  tool: string,
  args: Record<string, unknown>,
  owner: string | null = null,
  timeoutMs = TIMEOUT_MS
): Promise<string | null> {
  return new Promise((resolve) => {
    const env = { ...buildEnv(null), CBM_CACHE_DIR: cacheDir }
    const child = spawn(bin, ['cli', tool], { env })
    trackChild(child, owner)
    let out = ''
    const timer = setTimeout(() => {
      child.kill()
      resolve(null)
    }, timeoutMs)
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve(code === 0 ? out : null)
    })
    child.on('error', () => {
      clearTimeout(timer)
      resolve(null)
    })
    child.stdin.write(JSON.stringify(args))
    child.stdin.end()
  })
}
