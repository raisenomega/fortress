import type { ClaudePermissionMode } from '../settings/permission-mode'

/** Quien contesto: el CLI con herramientas reales, o solo la API de texto. */
export type ChatEngine = 'claude-code' | 'api'

export interface CodeAgentRequest {
  /** Carpeta del proyecto: es el directorio de trabajo del agente. */
  readonly projectPath: string
  readonly prompt: string
  readonly permissionMode: ClaudePermissionMode
}

export interface CodeAgentReply {
  readonly text: string
  readonly failed: boolean
  /** Operaciones que el agente quiso hacer y el modo de permisos bloqueo. */
  readonly denials: readonly string[]
}

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
