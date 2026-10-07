import { appendMessage } from '@application/chat/chat-history'
import { buildFeature, type BuildResult } from '@application/build/build-feature'
import type { AppContext } from '@application/context'
import type { Project } from '@domain/project/project'
import { err, ok, type Result } from '@domain/shared/result'
import { gitRevert, gitSnapshot } from '../git/git-snapshot'
import { cortaElTurno } from '@domain/chat/verificacion-del-arbol'
import { verificarArbol } from './build-verify'
import { agentFor, resolveEditTarget } from './build-target'
import { guardBarrera } from '../barrera-guard'

/** Fase 2: construye el plan aprobado con red git+verify y persiste el resultado. */
export async function runBuild(
  context: AppContext,
  projectId: string,
  intent: string,
  plan: string,
  /** El texto segun llega, para pintarlo en vivo (mismo cable que el Plan). */
  onChunk: (delta: string) => void = () => {}
): Promise<Result<void>> {
  // Ejecutor SI edita: aqui blinda el repo de FORTRESS (Plan/Investigacion no).
  const target = resolveEditTarget(context, projectId)
  if (!target.ok) return target
  const project = target.value
  // ADR-105: el Ejecutor edita SIEMPRE (`true`, sea cual sea el modo guardado);
  // con la barrera del cliente muerta no arranca, y el recibo queda en el
  // historial como cualquier otro «no aplicada».
  const rota = guardBarrera(context, projectId, true)
  const result = rota === null ? await construir(context, projectId, intent, plan, project, onChunk) : err<BuildResult>(rota) // prettier-ignore
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

function construir(
  context: AppContext,
  projectId: string,
  intent: string,
  plan: string,
  project: Project,
  onChunk: (delta: string) => void
): Promise<Result<BuildResult>> {
  return buildFeature(
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
    onChunk
  )
}
