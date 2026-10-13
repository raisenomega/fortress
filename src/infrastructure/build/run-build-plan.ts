import type { AppContext } from '@application/context'
import { asentarNotas } from '@application/system/asentar-notas'
import { notasDeBloque, sinBloqueDeNotas } from '@domain/system/extraer-notas'
import { buildPlanPrompt } from '@domain/build/build-prompt'
import { redactSecrets } from '@domain/chat/tool-detail'
import { err, ok, type Result } from '@domain/shared/result'
import { agentFor, resolveTarget } from './build-target'
import { savePlanDoc } from './save-plan-doc'

/**
 * Fase 1: el planner disena el plan (solo lectura) y FORTRESS lo guarda en .md.
 * Corre en 'lectura', no en 'plan': `plan` bloquea todo el MCP y el planner no
 * veia el grafo (bug 2 repetido, ROADMAP #5 sub-pieza 2). 'lectura' ademas le
 * QUITA Bash, que `plan` regalaba sin constar en ninguna lista.
 */
export async function runBuildPlan(
  context: AppContext,
  projectId: string,
  intent: string,
  /** El texto segun llega, para pintarlo en vivo: antes se tiraba con `() => {}`
   *  y el plan caia de golpe tras ~100s de pantalla muda (PASO 79). */
  onChunk: (delta: string) => void = () => {}
): Promise<Result<string>> {
  const target = resolveTarget(context, projectId)
  if (!target.ok) return target
  const reply = await agentFor(context).run(
    {
      projectPath: target.value.path,
      projectId: target.value.id,
      prompt: buildPlanPrompt(target.value.name, intent),
      permissionMode: 'lectura',
      agentId: 'planner',
      trusted: target.value.trusted
    },
    onChunk
  )
  // Construir observa (sub-pieza 3 del #5): la nota entra pase lo que pase con
  // el plan, y el bloque no llega ni al operador ni al `docs/` del cliente.
  asentarNotas(context, target.value, notasDeBloque(reply.text))
  // Tachado UNA vez aqui: el .md del repo del cliente, el ok() y el err() que
  // vuelven al renderer salen todos de la misma version, sin secretos.
  const texto = redactSecrets(sinBloqueDeNotas(reply.text))
  if (reply.failed) return err(texto)
  const saved = savePlanDoc(target.value.path, target.value.name, redactSecrets(intent), texto, new Date().toISOString()) // prettier-ignore
  return ok(saved ? `${texto}\n\n— Plan guardado en ${saved}` : texto)
}
