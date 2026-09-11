import type { CognitionWriter } from '@domain/cognition/cognition-writer'
import type { InformeWriter } from '@domain/scan/informe-writer'

/**
 * Los puertos que escriben un FICHERO, no una fila. Van juntos y aparte del
 * mapa de repositorios porque comparten contrato: los dos corren cuando el
 * escaneo ya esta guardado, los dos son mejor esfuerzo, y perder lo que
 * escriben no invalida nada. Un repositorio que falla si es un problema.
 */
export interface EscritoresDeFichero {
  /** La memoria del proyecto: COGNITION-LOG.md en su raiz. */
  readonly cognitionWriter: CognitionWriter
  /** El entregable de auditoria en userData (ADR-083, Fase 5). */
  readonly informeWriter: InformeWriter
}
