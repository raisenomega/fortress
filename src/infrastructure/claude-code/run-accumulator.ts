import type { CodeAgentReply } from '@domain/chat/code-agent'
import { redactSecrets } from '@domain/chat/tool-detail'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'
import { parseStreamLine } from './stream-events'

export interface RunAccumulator {
  absorb(line: string): void
  addStderr(text: string): void
  toReply(exitCode: number | null): CodeAgentReply
}

/**
 * Va juntando la salida del CLI. El texto se emite segun llega para que el
 * chat lo pinte en vivo; al cerrarse el proceso se compone la respuesta final
 * con lo que costo y con las herramientas que se usaron por el camino.
 *
 * El stderr es METADATO y acaba persistido como detalle del fallo, asi que
 * pasa por redactSecrets: el hijo se spawnea con la API key en su entorno, y
 * un volcado o una traza puede arrastrarla. Se redacta entero al cerrar y no
 * por trozo, porque un chunk puede partir un secreto por la mitad.
 */
export function createRunAccumulator(onChunk: (delta: string) => void): RunAccumulator {
  const collected: string[] = []
  const tools: string[] = []
  const edits: string[] = []
  let denials: readonly string[] = []
  let usage: TokenUsage = EMPTY_USAGE
  let finalText = ''
  let failed = false
  let stderr = ''

  return {
    absorb(line) {
      const event = parseStreamLine(line)
      if (!event) return

      if (event.editedFile) edits.push(event.editedFile)
      if (event.tool) {
        // Solo el NOMBRE se persiste; el detalle (ruta/comando redactado) va
        // por onChunk para leerse en vivo, pero nunca entra en `collected`.
        tools.push(event.tool)
        onChunk(`\n· ${event.tool}${event.detail ? ': ' + event.detail : ''}\n`)
      }
      if (event.text) {
        collected.push(event.text)
        onChunk(event.text)
      }
      if (event.finalText !== undefined) {
        finalText = event.finalText
        failed = event.failed === true
        denials = event.denials ?? []
        usage = event.usage ?? EMPTY_USAGE
      }
    },

    addStderr(text) {
      stderr += text
    },

    toReply(exitCode) {
      const text = collected.join('') || finalText
      if (exitCode === 0 && !failed) return { text, failed: false, denials, usage, tools, edits }

      const detail =
        redactSecrets(stderr).trim() || finalText || `el proceso termino con codigo ${exitCode}`
      return { text: text || detail, failed: true, denials, usage, tools, edits }
    }
  }
}
