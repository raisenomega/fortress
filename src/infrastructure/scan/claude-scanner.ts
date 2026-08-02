import type { CodeAgent } from '@domain/chat/code-agent'
import { parseScanOutput } from '@domain/scan/parse-scan-output'
import { buildScanPrompt } from '@domain/scan/scan-prompt'
import type { Scanner } from '@domain/scan/scanner'
import { err, ok } from '@domain/shared/result'

const FAILED = 'El escaneo no llego a terminar'

/**
 * Escanea con el mismo motor que el chat, pero SIEMPRE en modo plan, tambien
 * cuando el operador tiene FORTRESS en autonomo: auditar es mirar. Un escaner
 * que puede reescribir el codigo que audita deja de ser una medida y pasa a
 * ser un cambio, y entonces su informe ya no describe lo que habia.
 */
export function createClaudeScanner(codeAgent: CodeAgent): Scanner {
  return {
    isAvailable: () => codeAgent.isAvailable(),
    precheck: (projectPath) => codeAgent.precheck(projectPath),

    scan: async (request, onProgress) => {
      const startedAt = Date.now()

      const reply = await codeAgent.run(
        {
          projectPath: request.projectPath,
          prompt: buildScanPrompt(request.projectName),
          permissionMode: 'plan'
        },
        onProgress
      )

      if (reply.failed) return err(reply.text.trim() || FAILED)

      const parsed = parseScanOutput(reply.text)
      if (!parsed.ok) return err(parsed.error)

      return ok({ findings: parsed.value, durationMs: Date.now() - startedAt })
    }
  }
}
