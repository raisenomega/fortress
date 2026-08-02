import type { ChildProcessWithoutNullStreams } from 'child_process'
import { createInterface } from 'readline'
import type { CodeAgentReply } from '@domain/chat/code-agent'
import { createRunAccumulator } from './run-accumulator'

/** Un scan sobre un repo grande tarda; pasado esto se asume proceso colgado. */
const MAX_DURATION_MS = 15 * 60 * 1000

/** Consume la salida NDJSON del CLI y resuelve al cerrarse el proceso. */
export function collectRun(
  child: ChildProcessWithoutNullStreams,
  onChunk: (delta: string) => void
): Promise<CodeAgentReply> {
  return new Promise((resolve) => {
    const accumulator = createRunAccumulator(onChunk)
    const timer = setTimeout(() => child.kill('SIGTERM'), MAX_DURATION_MS)

    createInterface({ input: child.stdout }).on('line', (line) => accumulator.absorb(line))
    child.stderr.on('data', (chunk: Buffer) => accumulator.addStderr(chunk.toString()))

    child.on('error', (error) => {
      clearTimeout(timer)
      accumulator.addStderr(`No se pudo ejecutar Claude Code: ${error.message}`)
      resolve(accumulator.toReply(null))
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve(accumulator.toReply(code))
    })
  })
}
