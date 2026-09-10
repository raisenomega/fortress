import { appendMessage } from '@application/chat/chat-history'
import type { AppContext } from '@application/context'
import { runScan } from '@application/scan/run-scan'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { err, ok, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { endRun, isCancelled } from '../run-control'
import { guardRun } from '../run-guard'
import { createClaudeScanner } from '../scan/claude-scanner'
import { scanLogWriter } from '../scan/write-scan-log'
import { asentarIntentoFallido } from '@application/scan/asentar-intento-fallido'
import { medirProyecto } from '../scan/medir-proyecto'

/** Escanea y devuelve el score, o err (que el standby clasifica). Siempre plan. */
export async function loopScan(
  context: AppContext,
  projectId: string,
  onProgress: (delta: string) => void
): Promise<Result<number>> {
  const busy = guardRun(context, projectId)
  if (busy !== null) return err(busy)

  // Dentro del try, por lo mismo que en el handler del escaneo: un fallo al
  // armar el escaner no puede saltarse el `endRun` del finally.
  try {
    const budget = readBudget(context)
    const scanner = createClaudeScanner(
      createClaudeCodeAgent(context.apiKeys, budget, usesApiKey(context)),
      (intento) => asentarIntentoFallido(context, intento)
    )
    // El bucle autonomo pinta texto y ya tomo su carril: el metadato de parada
    // no tiene donde ir y la cancelacion es la suya, la del loop.
    const salidas = {
      progreso: { texto: onProgress, parada: () => undefined },
      scanLog: scanLogWriter
    }
    const summary = await runScan(context, scanner, projectId, salidas, {
      cancelado: () => isCancelled(projectId),
      medir: medirProyecto
    })
    if (!summary.ok) return err(summary.error)
    const c = summary.value.counts
    const resultado = `Escaneo: ${summary.value.score}/100 — ${c.CRITICAL} CRITICAL, ${c.HIGH} HIGH, ${c.MEDIUM} MEDIUM, ${c.LOW} LOW`
    onProgress(`\n\n${resultado}\n`) // en vivo
    // Persistido: sobrevive al reinicio (el detalle en vivo es de sesion).
    appendMessage(context, {
      projectId,
      role: 'assistant',
      content: resultado,
      agentId: 'security-reviewer',
      mode: 'autonomo',
      engine: 'claude-code'
    })
    return ok(summary.value.score)
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo inesperado al escanear')
  } finally {
    endRun(projectId)
  }
}
