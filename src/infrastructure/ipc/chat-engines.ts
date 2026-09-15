import type { AppContext } from '@application/context'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import type { Assistant } from '@domain/chat/assistant'
import type { CodeAgent } from '@domain/chat/code-agent'
import { buildMcpConfig } from '@domain/connectors/mcp-config'
import { resolveAssistant } from '../ai/assistant-factory'
import { activeCustomAgents } from '../claude-code/active-custom-agents'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { SIN_TECHO } from '../claude-code/run-claude-process'

/**
 * Motores del chat para un envio: el agente CLI (con los conectores MCP y los
 * agentes auto-propuestos activos) y, si hay API key, el asistente de solo
 * texto. Los conectores solo viajan al chat: un escaneo no necesita Figma.
 *
 * El agente CLI corre SIN techo de tiempo (ADR-088, pieza 1; ADR-082, Enmienda
 * 4), con el molde del escaneo: solo Detener lo para. Es UN agente para los tres
 * caminos del Terminal —conversacion, workflow y entrevista—, y los tres le
 * pasan su projectId, que es lo que deja a Detener alcanzarlo.
 */
export function buildChatEngines(context: AppContext): {
  codeAgent: CodeAgent
  assistant: Assistant | null
} {
  const budget = readBudget(context)
  const mcp = buildMcpConfig(context.connectors.list())
  const customs = activeCustomAgents(context.agentDrafts.listActive())
  const codeAgent = createClaudeCodeAgent(
    context.apiKeys,
    budget,
    usesApiKey(context),
    mcp,
    customs,
    SIN_TECHO
  )
  const assistant = resolveAssistant(context.apiKeys)
  return { codeAgent, assistant: assistant.ok ? assistant.value : null }
}
