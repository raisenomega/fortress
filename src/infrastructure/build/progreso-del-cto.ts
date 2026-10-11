import type { FaseDelTurno } from '@domain/chat/fase-del-turno'

/**
 * Las dos fases del turno del CTO tejidas sobre el stream (PASO 158): 'contexto'
 * cuando el ensamblado de marcos ya resolvio; 'bloque' en el PRIMER delta de
 * texto y una SOLA vez — el CTO ya no tiene herramientas (155), asi que el primer
 * delta ES el bloque, sin lineas de tool que filtrar. Puro: no lanza el CLI.
 */
export function tejerFasesDelCto(
  emitir: (fase: FaseDelTurno) => void,
  onChunk: (delta: string) => void
): { contexto: () => void; onChunk: (delta: string) => void } {
  let bloque = false
  return {
    contexto: () => emitir('contexto'),
    onChunk: (delta) => {
      if (!bloque) {
        bloque = true
        emitir('bloque')
      }
      onChunk(delta)
    }
  }
}
