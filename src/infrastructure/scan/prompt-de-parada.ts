import { RAIZ } from '@domain/scan/dividir-en-paradas'
import { TODO_EL_PROYECTO } from '@domain/scan/modulos-de-tema'
import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'
// prettier-ignore
import type { AlcanceDePasada, PlantillaDeModulo } from '@domain/scan/resumen-de-modulo'
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
 * Sin rutas la pasada es de TEMA y mira el proyecto entero: sus `grep` salen de
 * la raiz, pero el encabezado lo dice con palabras. Decir «en .» contaria mal
 * lo que se esta haciendo, y es lo unico que distingue a las dos clases aqui:
 * la ausencia de `rutas` ya significaba «el proyecto entero» desde ADR-082, asi
 * que `ScanRequest` no necesita un campo mas para saberlo.
 */
const alcanceDe = (rutas?: readonly string[]): AlcanceDePasada =>
  rutas === undefined || rutas.length === 0
    ? { ruta: RAIZ, nombre: TODO_EL_PROYECTO }
    : { ruta: rutas[0], nombre: rutas[0] }

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
  if (modulos.length === 0) return buildScanPrompt(request.projectName, corpus, request.rutas, undefined, request.registradas, request.barreras) // prettier-ignore

  const temas = { ...alcanceDe(request.rutas), modulos, plantillas: sembradas(modulos) }
  return buildScanPrompt(
    request.projectName,
    corpus,
    request.rutas,
    temas,
    request.registradas,
    request.barreras
  )
}
