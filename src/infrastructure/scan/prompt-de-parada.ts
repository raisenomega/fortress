import { RAIZ } from '@domain/scan/dividir-en-paradas'
import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'
import type { PlantillaDeModulo } from '@domain/scan/resumen-de-modulo'
import { buildScanPrompt } from '@domain/scan/scan-prompt'
import type { ScanRequest } from '@domain/scan/scanner'
import { discoverCorpus } from '../project/discover-corpus'
import { leerPlantilla } from './leer-plantilla'

/** Las plantillas que hay EN DISCO de los modulos pedidos. Las que faltan no
 *  aparecen: la ausencia se convierte en un bloque mas corto, no en un fallo. */
function sembradas(modulos: readonly ModuloAuditoria[]): readonly PlantillaDeModulo[] {
  return modulos
    .map((modulo) => ({ modulo, texto: leerPlantilla(modulo) }))
    .filter((p): p is PlantillaDeModulo => p.texto !== null)
}

/**
 * El prompt de una pasada, con las plantillas de su carpeta ya leidas.
 *
 * Vive aqui y no en el escaner porque leer `userData` es I/O y componer el
 * prompt es dominio puro: el reparto de siempre. El dominio recibe TEXTO de
 * plantilla, nunca una ruta, y por eso se prueba sin sembrar nada.
 */
export function promptDeParada(request: ScanRequest): string {
  const corpus = discoverCorpus(request.projectPath)
  const modulos = request.modulos ?? []
  if (modulos.length === 0) return buildScanPrompt(request.projectName, corpus, request.rutas)

  // Sin ruta, la parada es el proyecto entero: la raiz es su carpeta.
  const carpeta = request.rutas?.[0] ?? RAIZ
  const temas = { carpeta, plantillas: sembradas(modulos) }
  return buildScanPrompt(request.projectName, corpus, request.rutas, temas)
}
