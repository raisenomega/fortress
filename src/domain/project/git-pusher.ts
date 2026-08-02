import type { Result } from '../shared/result'

/**
 * Puerto del push. Solo se invoca cuando pushState dice "listo": la decision
 * de si el repo puede salir es del dominio, no de quien ejecuta git.
 */
export interface GitPusher {
  /** Resumen de lo que dijo git, o el motivo del fallo. */
  push(projectPath: string): Promise<Result<string>>
}
