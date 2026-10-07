import type { AgentId } from '@domain/agent/agent'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { VeredictoDelPlan } from '@domain/chat/juicio-del-plan'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { TokenUsage } from '@domain/telemetry/token-usage'

export interface SendMessageInput {
  readonly projectId: string
  readonly prompt: string
  readonly mode: OperationMode
  /** Agentes que el operador dejo fuera desde el sidebar. */
  readonly excludedAgents: readonly AgentId[]
  /**
   * El hallazgo que el operador mando a resolver desde su fila del Escaneo
   * (ADR-088, pieza 2). Solo el id: el main relee todo lo demas de la base y no
   * se fia de lo que diga el renderer. Sin el, el turno es el de siempre.
   */
  readonly findingId?: string
  /**
   * Los hallazgos del LOTE (ADR-088, arco 1). Sin `findingId` es el turno de
   * PLAN: el productor los ve todos y propone su orden. Con `findingId` son los
   * HERMANOS, solo contexto. Nunca sustituye al foco, que sigue siendo UNO.
   */
  readonly lote?: readonly string[]
}

export interface SendMessageOutput {
  readonly user: ChatMessage
  readonly assistant: ChatMessage
  /** Que respondio: el CLI con herramientas reales o solo la API de texto. */
  readonly engine: ChatEngine
  /** La guarda que corto el cierre del ciclo, o null si no habia que cerrar o
   *  se cerro. Enum y numeros: cruza el puente sin llevar nada del proyecto. */
  readonly sinCierre: SinCierre | null
  /** El turno se conservo SIN que nadie pudiera compilar el proyecto (ADR-091).
   *  Un booleano: cruza el puente sin llevar nada del codigo del cliente. */
  readonly sinVerificar: boolean
  /** El CIERRE del resultado (PASO 87): lo que el ReporteDeTarea empaqueta.
   *  Datos PLANOS que ya cruzaban por otras vias — rutas (Actividad), numeros
   *  (medidor) y el texto solo via `assistant`, ya tachado y sin NOTAS. */
  readonly failed: boolean
  readonly edits: readonly string[]
  readonly usage: TokenUsage
  /** El modelo que DE VERDAD corrio el turno (ADR-078), si el CLI lo dijo. */
  readonly modelo?: string
  readonly hallazgos: number
  /**
   * El veredicto de OMEGA sobre la DIRECCION del plan del lote (ADR-097 §2).
   *
   * OPCIONAL y lo pone la INFRA, no `sendMessage`: el juicio del plan corre
   * DESPUES del turno —necesita la prosa que el turno produjo— y desde su propia
   * costura, en `chat-send-handler`. Ponerlo aqui obligaria a `sendMessage` a
   * conocer un juicio que no es suyo, y esa funcion ya carga once parametros.
   */
  readonly plan?: VeredictoDelPlan | null
}
