import type { MarcoDelKit } from './bloque-cto-kit'
import { marcoDeLineas } from './marcos-del-libro'

const TOPE_LENG = 6
const TOPE_CLUSTERS = 8

export interface GrafoLenguaje {
  readonly name: string
  readonly files: number
}
export interface GrafoCluster {
  readonly label: string
  readonly members: number
}
/** El overview del grafo YA leido y parseado por el adaptador (infra). */
export interface GrafoOverview {
  readonly nodes: number
  readonly edges: number
  readonly languages: readonly GrafoLenguaje[]
  readonly clusters: readonly GrafoCluster[]
}

/**
 * El marco del GRAFO del proyecto anclado (Sello B.2): el radio de arquitectura
 * —nodos, aristas, lenguajes y los modulos de facto (clusters)— como TEXTO de
 * alta señal. Dominio puro: recibe el overview (dato, no ruta), o null si el
 * proyecto no tiene grafo o el binario fallo, y entonces texto vacio que
 * `bloqueCtoKit` deja caer. Minima no es corta, es sin ruido: solo overview,
 * lenguajes y clusters con TOPE.
 */
export function marcoDeGrafo(ov: GrafoOverview | null): MarcoDelKit {
  if (ov === null) return marcoDeLineas('grafo-arquitectura', [])
  const leng = ov.languages
    .slice(0, TOPE_LENG)
    .map((l) => `${l.name}(${l.files})`)
    .join(', ')
  const clusters = ov.clusters.slice(0, TOPE_CLUSTERS).map((c) => `· ${c.label} (${c.members})`)
  return marcoDeLineas('grafo-arquitectura', [
    `${ov.nodes} nodos · ${ov.edges} aristas`,
    `lenguajes: ${leng}`,
    `modulos de facto (${ov.clusters.length}):`,
    ...clusters
  ])
}
