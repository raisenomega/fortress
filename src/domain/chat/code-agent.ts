import type { AgentId } from '../agent/agent'
import type { ClaudePermissionMode } from '../settings/permission-mode'
import type { CodeAgentReply } from './code-agent-reply'

/** Quien contesto: el CLI con herramientas reales, o solo la API de texto. */
export type ChatEngine = 'claude-code' | 'api'

export interface CodeAgentRequest {
  /** Carpeta del proyecto: es el directorio de trabajo del agente. */
  readonly projectPath: string
  /**
   * De quien es este proceso, para que una parada alcance solo lo suyo. Es el
   * MISMO id que el candado de ejecucion, no la ruta: dos claves para la misma
   * cosa acaban discrepando. Ausente = de nadie (un sandbox de aprendizaje, un
   * borrador de agente), y a esos no los para ningun proyecto.
   */
  readonly projectId?: string
  readonly prompt: string
  readonly permissionMode: ClaudePermissionMode
  /** Agente que se hace cargo. Null deja que Claude Code decida por su cuenta. */
  readonly agentId: AgentId | null
  /**
   * Proyecto de confianza. Solo entonces se pasa el allowlist de
   * autoverificacion, y solo al editar (acceptEdits). Ver selfVerifyRules.
   */
  readonly trusted: boolean
  /** Sesion del CLI a reanudar: la memoria del productor por hallazgo (ADR-088,
   *  Enmienda 2). Ausente = sesion nueva. Se reanuda en una DERIVADA, asi que la
   *  guardada no cambia hasta que el turno demuestre que merece recordarse. */
  readonly reanudarSesion?: string
}

export type { CodeAgentReply } from './code-agent-reply'

/**
 * Puerto del agente que ejecuta de verdad dentro del proyecto: filesystem,
 * bash, git. El dominio no sabe que detras hay un proceso `claude`.
 */
export interface CodeAgent {
  /** Falso si la herramienta no esta instalada en el equipo. */
  isAvailable(): boolean
  /**
   * Motivo por el que no se puede ejecutar sobre esa carpeta, o null si todo
   * esta en orden. Se comprueba antes de lanzar nada: un cwd inexistente hace
   * que Node falle con "spawn claude ENOENT", que parece que falta el CLI.
   */
  precheck(projectPath: string): string | null
  run(request: CodeAgentRequest, onChunk: (delta: string) => void): Promise<CodeAgentReply>
}
