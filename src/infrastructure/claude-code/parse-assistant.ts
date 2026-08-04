import { toolDetail, type ToolInput } from '@domain/chat/tool-detail'
import { isEditTool } from '@domain/telemetry/edit-tools'

interface ContentBlock {
  type: string
  text?: string
  name?: string
  input?: ToolInput
}

export interface AssistantEvent {
  readonly text?: string
  readonly tool?: string
  /** Ruta escrita, solo cuando la herramienta edita. Se PERSISTE. */
  readonly editedFile?: string
  /** Objetivo de la herramienta para la linea EN VIVO. Efimero: NO se persiste. */
  readonly detail?: string
}

/**
 * Se persisten el nombre y, si edita, la ruta. Ademas se extrae un `detail`
 * —ruta, patron o comando redactado— SOLO para la linea en vivo: el acumulador
 * lo emite por onChunk pero nunca lo guarda, asi que un secreto en un comando
 * de Bash no llega ni a la base ni al timeline.
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
  const detail = use ? toolDetail(use.name ?? '', use.input) : undefined

  return {
    ...(text ? { text } : {}),
    ...(use?.name ? { tool: use.name } : {}),
    ...(edited ? { editedFile: edited } : {}),
    ...(detail ? { detail } : {})
  }
}
