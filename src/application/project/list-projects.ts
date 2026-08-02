import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

export function listProjects(context: AppContext): readonly Project[] {
  return context.projects.list()
}
