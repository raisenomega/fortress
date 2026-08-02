import type { NewProject, Project } from './project'

/** Puerto de persistencia de proyectos. La infraestructura lo implementa. */
export interface ProjectRepository {
  list(): readonly Project[]
  findById(id: string): Project | null
  findByPath(path: string): Project | null
  add(project: NewProject): Project
  remove(id: string): void
}
