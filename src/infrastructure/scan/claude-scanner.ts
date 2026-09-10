import type { CodeAgent } from '@domain/chat/code-agent'
import { parseScanOutput } from '@domain/scan/parse-scan-output'
import { buildScanPrompt } from '@domain/scan/scan-prompt'
import { discoverCorpus } from '../project/discover-corpus'
import type { ScanRequest, Scanner } from '@domain/scan/scanner'
import { err, ok } from '@domain/shared/result'
import { avisarDelFallo, type AvisoDeFallo } from './aviso-de-fallo'

const FAILED = 'El escaneo no llego a terminar'

/**
 * Escanea con el mismo motor que el chat, pero SIEMPRE en modo plan, tambien en
 * autonomo: auditar es mirar. Un escaner que puede reescribir el codigo que
 * audita deja de ser una medida y pasa a ser un cambio, y su informe ya no
 * describe lo que habia. `onFallo` recibe el intento con su factura cuando NO
 * hay informe; el camino bueno no avisa, ese asienta en el cierre como siempre.
 */
export function createClaudeScanner(
  codeAgent: CodeAgent,
  onFallo: AvisoDeFallo = () => undefined
): Scanner {
  return {
    isAvailable: () => codeAgent.isAvailable(),
    precheck: (projectPath) => codeAgent.precheck(projectPath),
    scan: (request, onProgress) => escanear(codeAgent, onFallo, request, onProgress)
  }
}

/** Una pasada: pide, cronometra, y decide si hubo informe o solo gasto. */
async function escanear(
  codeAgent: CodeAgent,
  onFallo: AvisoDeFallo,
  request: ScanRequest,
  onProgress: (delta: string) => void
): ReturnType<Scanner['scan']> {
  const startedAt = Date.now()

  const reply = await codeAgent.run(
    {
      projectPath: request.projectPath,
      projectId: request.projectId,
      prompt: buildScanPrompt(request.projectName, discoverCorpus(request.projectPath), request.rutas), // prettier-ignore
      permissionMode: 'plan',
      // La FASE 1 es cosa del Security Reviewer, siempre el mismo agente.
      agentId: 'security-reviewer',
      // Auditar es mirar: el escaner nunca se autoverifica, sea cual sea la
      // confianza del proyecto. Doble seguro (ademas de que va en plan).
      trusted: false
    },
    onProgress
  )
  const durationMs = Date.now() - startedAt

  if (reply.failed) {
    avisarDelFallo(onFallo, request.projectId, reply, 'proceso', durationMs)
    return err(reply.text.trim() || FAILED)
  }

  const parsed = parseScanOutput(reply.text)
  if (!parsed.ok) {
    // Termino BIEN y no se le entendio: la factura es legible y hasta hoy se
    // tiraba igual. Es el caso exacto de Health Flow.
    avisarDelFallo(onFallo, request.projectId, reply, 'informe-ilegible', durationMs)
    return err(parsed.error)
  }

  return ok({
    findings: parsed.value,
    durationMs,
    usage: reply.usage,
    tools: reply.tools,
    edits: reply.edits,
    texto: reply.text
  })
}
