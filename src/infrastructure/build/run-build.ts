import { appendMessage } from '@application/chat/chat-history'
import { buildFeature } from '@application/build/build-feature'
import type { AppContext } from '@application/context'
import { err, ok, type Result } from '@domain/shared/result'
import { gitRevert, gitSnapshot } from '../git/git-snapshot'
import { cortaElTurno } from '@domain/chat/verificacion-del-arbol'
import { verificarArbol } from './build-verify'
import { agentFor, resolveEditTarget } from './build-target'

/** Fase 2: construye el plan aprobado con red git+verify y persiste el resultado. */
export async function runBuild(
  context: AppContext,
  projectId: string,
  intent: string,
  plan: string
): Promise<Result<void>> {
  // Ejecutor SI edita: aqui blinda el repo de FORTRESS (Plan/Investigacion no).
  const target = resolveEditTarget(context, projectId)
  if (!target.ok) return target
  const project = target.value
  const result = await buildFeature(
    context,
    projectId,
    intent,
    plan,
    agentFor(context),
    {
      snapshot: () => gitSnapshot(project.path, 'build: checkpoint'),
      revert: (sha) => gitRevert(project.path, sha),
      // El Ejecutor revierte con `false` (build-feature.ts:57). Su booleano
      // siempre quiso decir «no esta roto», y eso es exactamente `!cortaElTurno`:
      // una fase que no se pudo medir no revierte una construccion (ADR-091).
      verify: async () => !cortaElTurno((await verificarArbol(project.path)).arbol)
    },
    () => {}
  )
  const text = result.ok
    ? `Construccion completada:\n\n${result.value.text}`
    : `Construccion no aplicada: ${result.error}`
  appendMessage(context, {
    projectId,
    role: 'assistant',
    content: text,
    agentId: null,
    mode: 'autonomo',
    engine: 'claude-code'
  })
  return result.ok ? ok(undefined) : err(result.error)
}
