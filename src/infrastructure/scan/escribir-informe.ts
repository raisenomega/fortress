import { app } from 'electron'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { componerInforme } from '@domain/scan/informe-de-auditoria'
import type { InformeWriter } from '@domain/scan/informe-writer'

const CARPETA = 'audit-reports'

/**
 * En `userData`, junto a `fortress.db` y a los `scan-logs`, y NO en el repo
 * auditado: es un documento de FORTRESS sobre codigo ajeno, y dejarlo dentro
 * del proyecto del cliente lo ensuciaria y podria colarse en un commit suyo.
 * Mismo argumento, mismo sitio y mismo nombre por `scanId` que la transcripcion.
 */
function destino(scanId: string): string {
  const carpeta = join(app.getPath('userData'), CARPETA)
  mkdirSync(carpeta, { recursive: true })
  return join(carpeta, `${scanId}.md`)
}

/** Deja el entregable en disco. Mejor esfuerzo: ver `InformeWriter`. */
export const informeWriter: InformeWriter = {
  write: (datos) => {
    try {
      writeFileSync(destino(datos.scanId), componerInforme(datos), 'utf8')
    } catch (error) {
      // El escaneo ya esta cerrado y guardado; perder el informe no lo invalida.
      console.error('[scan] no se pudo escribir el informe', datos.scanId, error)
    }
  }
}
