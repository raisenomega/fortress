import { useState } from 'react'
import type { Project } from '@domain/project/project'
import { removeProject } from '../../services/project-service'
import { useProjectStore } from '../../stores/project-store'
import { ConfirmRemoveProject } from './ConfirmRemoveProject'
import { ProjectListItem } from './ProjectListItem'

export function ProjectList(): React.JSX.Element {
  const projects = useProjectStore((state) => state.projects)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProject = useProjectStore((state) => state.setActiveProject)
  const [pending, setPending] = useState<Project | null>(null)

  if (projects.length === 0) {
    return (
      <p className="px-2 text-xs text-muted-foreground">
        Sin proyectos todavia. Agrega uno para empezar.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <ProjectListItem
          key={project.id}
          project={project}
          active={project.id === activeProjectId}
          onSelect={setActiveProject}
          onRemove={setPending}
        />
      ))}

      {pending ? (
        <ConfirmRemoveProject
          project={pending}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            void removeProject(pending.id)
            setPending(null)
          }}
        />
      ) : null}
    </div>
  )
}
