import type { DeclaracionDeModulos } from '../scan/declaracion-de-modulos'
import type { DimensionScores } from '../score/dimension'
import type { ConfigState } from './config-state'
import type { NewProject, Project } from './project'

/** Puerto de persistencia de proyectos. La infraestructura lo implementa. */
export interface ProjectRepository {
  list(): readonly Project[]
  findById(id: string): Project | null
  findByPath(path: string): Project | null
  add(project: NewProject): Project
  remove(id: string): void
  /** Deja constancia del ultimo escaneo. Es lo unico que escribe el score. */
  updateScan(id: string, score: number, scannedAt: string): void
  /** Marca un proyecto de confianza: habilita la autoverificacion del agente. */
  setTrusted(id: string, trusted: boolean): void
  /** Enciende o apaga el loop autonomo para este proyecto. */
  setLoopEnabled(id: string, enabled: boolean): void
  /** Nota de CALIDAD GENERAL, de una auditoria integral. Distinta del score de seguridad. */
  setGeneralQuality(id: string, score: number): void
  /** Score integral: global + parcial + las 6 dimensiones (cada una null = sin datos). */
  setQuality(id: string, global: number, dims: DimensionScores, partial: boolean): void
  /** Transicion del ciclo de vida del marco: PENDIENTE_CONFIGURACION -> CONFIGURADO. */
  setConfigState(id: string, state: ConfigState): void
  /** Marca has_graph=1 y guarda las stats del indice (nodos, aristas, fecha ISO). */
  setGraph(id: string, nodes: number, edges: number, indexedAt: string): void
  /** Inverso: el indice ya no esta en disco. has_graph=0 y las stats a NULL. */
  clearGraph(id: string): void
  /** Circuit breaker (Capa 4): marca el proyecto CONTAMINADO con el detalle forense. */
  markContaminated(id: string, detail: string): void
  /** Inverso de markContaminated: el operador reviso el forense y desbloqueo el proyecto. */
  markClean(id: string): void
  /** Lo que el operador declara sobre los modulos que no se detectan por fichero (ADR-083). */
  setModulosDeclarados(id: string, declaracion: DeclaracionDeModulos): void
}
