import type { CodeAgent } from '@domain/chat/code-agent'
import type { Scanner } from '@domain/scan/scanner'
import type { AvisoDeFallo } from './aviso-de-fallo'
import { escanear } from './una-pasada'

/**
 * Escanea con el mismo motor que el chat, pero SIEMPRE en modo plan, tambien en
 * autonomo: auditar es mirar. Un escaner que puede reescribir el codigo que
 * audita deja de ser una medida y pasa a ser un cambio, y su informe ya no
 * describe lo que habia. `onFallo` recibe el intento con su factura cuando NO
 * hay informe; el camino bueno no avisa, ese asienta en el cierre como siempre.
 *
 * Las notas de ADR-085 viajan en el outcome sin asentarse: esto corre una vez
 * por parada, y fundir las copias es del recorrido.
 */
export function createClaudeScanner(
  codeAgent: CodeAgent,
  onFallo: AvisoDeFallo = () => undefined
): Scanner {
  return {
    isAvailable: () => codeAgent.isAvailable(),
    precheck: (projectPath) => codeAgent.precheck(projectPath),
    scan: (request, onProgress) => escanear(codeAgent, onFallo, request, onProgress)
  }
}
