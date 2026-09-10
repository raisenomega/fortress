import type { ModuloAuditoria } from './modulo-auditoria'
// prettier-ignore
import { POR_DEPENDENCIA, POR_EXTENSION, POR_FICHERO_RAIZ, POR_PATRON, type TablaDeSenales } from './senales-de-modulo'

/**
 * Pistas recogidas del filesystem. El dominio no lee disco: solo decide. Misma
 * forma que `StackEvidence`, del que este detector es hermano —y por la misma
 * razon: asi se prueba con arrays en memoria y no montando tres repositorios.
 */
export interface EvidenciaDeModulos {
  /** Rutas relativas de las senales versionadas, tal cual las da git. */
  readonly ficheros: readonly string[]
  /** Dependencias declaradas (npm, pip, ...). */
  readonly dependencias: readonly string[]
}

type Comparar = (valor: string, senal: string) => boolean

const sufijo: Comparar = (valor, senal) => valor.endsWith(senal)
const exacto: Comparar = (valor, senal) => valor === senal
const trozo: Comparar = (valor, senal) => valor.includes(senal)
const prefijo: Comparar = (valor, senal) => valor.startsWith(senal)

/** Molde `matches` de `stack.ts`: filtra la tabla y se queda con la etiqueta. */
const casan = (
  tabla: TablaDeSenales,
  valores: readonly string[],
  como: Comparar
): readonly ModuloAuditoria[] =>
  tabla.filter(([senal]) => valores.some((v) => como(v, senal))).map(([, modulo]) => modulo)

/**
 * Si una ruta es una SENAL de modulo. Se deriva de las mismas tablas que
 * deciden, asi que la lista que se enumera y la lista que se mira no pueden
 * separarse: anadir `.astro` a la tabla lo mete tambien en la enumeracion.
 *
 * Hermano de `esFuente`, y deliberadamente OTRO: `ES_FUENTE` dice que es codigo
 * —y no se toca, que es lo que cuenta las paradas—; esto dice que delata un
 * modulo. Un `docker-compose.yml` no es fuente y sigue siendo una senal.
 */
export function esSenal(ruta: string): boolean {
  const r = ruta.toLowerCase()
  return (
    POR_EXTENSION.some(([s]) => sufijo(r, s)) ||
    POR_FICHERO_RAIZ.some(([s]) => exacto(r, s)) ||
    POR_PATRON.some(([s]) => trozo(r, s))
  )
}

/** Los modulos que la evidencia delata. Puro: sin disco, sin modelo, sin red. */
export function modulosDetectados(evidencia: EvidenciaDeModulos): ReadonlySet<ModuloAuditoria> {
  const ficheros = evidencia.ficheros.map((f) => f.toLowerCase())
  const enLaRaiz = ficheros.filter((f) => !f.includes('/'))
  const dependencias = evidencia.dependencias.map((d) => d.toLowerCase())

  return new Set([
    ...casan(POR_EXTENSION, ficheros, sufijo),
    ...casan(POR_FICHERO_RAIZ, enLaRaiz, exacto),
    ...casan(POR_PATRON, ficheros, trozo),
    ...casan(POR_DEPENDENCIA, dependencias, prefijo)
  ])
}
