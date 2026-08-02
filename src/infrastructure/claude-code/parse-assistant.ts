import { isEditTool } from '@domain/telemetry/edit-tools'

interface ContentBlock {
  type: string
  text?: string
  name?: string
  input?: { file_path?: string }
}

export interface AssistantEvent {
  readonly text?: string
  readonly tool?: string
  /** Ruta escrita, solo cuando la herramienta edita. */
  readonly editedFile?: string
}

/**
 * De la entrada de una herramienta solo se conserva su nombre y, si escribe,
 * la ruta del archivo. El resto del input NO se toca a proposito: un comando
 * de Bash puede llevar un token dentro, y esto termina guardado en la base y
 * pintado en el timeline.
 */
export function parseAssistant(event: Record<string, unknown>): AssistantEvent | null {
  const message = event.message as { content?: ContentBlock[] } | undefined
  const blocks = message?.content ?? []

  const text = blocks
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('')

  const use = blocks.find((block) => block.type === 'tool_use')
  if (!text && !use) return null

  const edited = use && isEditTool(use.name ?? '') ? use.input?.file_path : undefined

  return {
    ...(text ? { text } : {}),
    ...(use?.name ? { tool: use.name } : {}),
    ...(edited ? { editedFile: edited } : {})
  }
}
