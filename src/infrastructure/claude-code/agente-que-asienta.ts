import type { AppContext } from '@application/context'
import { CTO_OWNER } from '@domain/build/cto-owner'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { RunKind } from '@domain/telemetry/agent-run'

/**
 * Envuelve un CodeAgent para que su corrida quede asentada. Molde
 * `costTrackingAgent`, y por la misma razon: no cambia el comportamiento del
 * agente, solo observa lo que ya pasa.
 *
 * Existe porque de los doce sitios que llaman a `run()`, SEIS no asientan nada
 * —el juez de aplicabilidad, el build, genesis, los episodios, el borrador y el
 * grafo A/B—. No es que olvidaran copiar un patron: los que si asientan lo
 * hacen desde un ORQUESTADOR que tiene contexto que `run()` no tiene (el
 * proyecto del chat, el `kind` del motor, el agregado de doce paradas). Estos
 * seis no tienen orquestador encima, y su gasto no constaba en ninguna parte.
 *
 * El juez lo destapo: corrio en el escaneo de 199 minutos del 2026-09-11, dejo
 * sus dos veredictos en el Libro, y `agent_runs` no tenia ni una fila suya.
 *
 * NO se aplica a los tres que ya asientan —chat, motor y escaner—: ahi seria
 * una segunda fila de lo mismo, y para el escaneo ademas serian doce, que es
 * justo lo que la tabla `scan_parada_runs` evito para no mover el score de OMEGA.
 */
export function agenteQueAsientaCorrida(
  agent: CodeAgent,
  context: AppContext,
  kind: RunKind
): CodeAgent {
  return {
    isAvailable: agent.isAvailable,
    precheck: agent.precheck,
    run: async (request, onChunk) => {
      // `run()` no devuelve duracion: se mide alrededor del await, como hace
      // `claude-scanner` desde que existe.
      const desde = Date.now()
      const reply = await agent.run(request, onChunk)

      // Sin `projectId` la corrida no es de nadie —un sandbox de aprendizaje, un
      // borrador— y `agent_runs.project_id` es NOT NULL con clave foranea: su
      // fila seria huerfana o no entraria. Se salta, y consta aqui por que.
      // CTO_OWNER es ese mismo caso: un CARRIL (el del Detener del CTO), no un
      // proyecto real; asentarlo intentaria un INSERT que la FK rechaza (149b).
      if (request.projectId !== undefined && request.projectId !== CTO_OWNER) {
        try {
          context.runs.record({
            projectId: request.projectId,
            agentId: request.agentId,
            kind,
            durationMs: Date.now() - desde,
            failed: reply.failed,
            usage: reply.usage,
            tools: reply.tools,
            ...(reply.modelo === undefined ? {} : { modelo: reply.modelo })
          })
        } catch (error) {
          // Mejor esfuerzo: perder la fila es molesto; perder lo que el agente
          // acaba de producir, no.
          console.error('[telemetria] no se pudo asentar la corrida', kind, error)
        }
      }
      return reply
    }
  }
}
