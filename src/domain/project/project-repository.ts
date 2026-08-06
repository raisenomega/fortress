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
  /** Transicion del ciclo de vida del marco: PENDIENTE_CONFIGURACION -> CONFIGURADO. */
  setConfigState(id: string, state: ConfigState): void
}
