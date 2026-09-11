import type { CodeAgent } from '@domain/chat/code-agent'
import { notasDelInforme } from '@domain/scan/notas-del-informe'
import { parseScanOutput } from '@domain/scan/parse-scan-output'
import type { ScanRequest, Scanner } from '@domain/scan/scanner'
import { err, ok } from '@domain/shared/result'
import { avisarDelFallo, type AvisoDeFallo } from './aviso-de-fallo'
import { promptDeParada } from './prompt-de-parada'

const FAILED = 'El escaneo no llego a terminar'

/** Una pasada: pide, cronometra, y decide si hubo informe o solo gasto. */
export async function escanear(
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
      prompt: promptDeParada(request),
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
    texto: reply.text,
    notas: notasDelInforme(reply.text)
  })
}
