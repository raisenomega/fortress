import type { CodeAgentReply } from '@domain/chat/code-agent'
import { parseStreamLine } from './stream-events'

export interface RunAccumulator {
  absorb(line: string): void
  addStderr(text: string): void
  toReply(exitCode: number | null): CodeAgentReply
}

/**
 * Va juntando la salida del CLI. El texto se emite segun llega para que el
 * chat lo pinte en vivo; al cerrarse el proceso se compone la respuesta final.
 */
export function createRunAccumulator(onChunk: (delta: string) => void): RunAccumulator {
  const collected: string[] = []
  let denials: readonly string[] = []
  let finalText = ''
  let failed = false
  let stderr = ''

  return {
    absorb(line) {
      const event = parseStreamLine(line)
      if (!event) return

      if (event.tool) onChunk(`\n· ${event.tool}\n`)
      if (event.text) {
        collected.push(event.text)
        onChunk(event.text)
      }
      if (event.finalText !== undefined) {
        finalText = event.finalText
        failed = event.failed === true
        denials = event.denials ?? []
      }
    },

    addStderr(text) {
      stderr += text
    },

    toReply(exitCode) {
      const text = collected.join('') || finalText
      if (exitCode === 0 && !failed) return { text, failed: false, denials }

      const detail = stderr.trim() || finalText || `el proceso termino con codigo ${exitCode}`
      return { text: text || detail, failed: true, denials }
    }
  }
}
