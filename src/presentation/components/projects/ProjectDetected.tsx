import type { NewProject } from '@domain/project/project'
import { Chip } from '../common/Chip'

interface ProjectDetectedProps {
  readonly draft: NewProject
}

/** Resumen de lo que se detecto solo, para que el operador lo confirme. */
export function ProjectDetected({ draft }: ProjectDetectedProps): React.JSX.Element | null {
  if (!draft.path) return null

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      <Chip
        tone={draft.gitBranch ? 'agent' : 'mode'}
        icon="🌿"
        label={draft.gitBranch ?? 'sin git'}
        title={draft.gitRemote ?? 'Sin remoto configurado'}
      />
      <Chip
        tone={draft.hasClaude ? 'agent' : 'mode'}
        icon="📄"
        label={draft.hasClaude ? 'CLAUDE.md' : 'sin CLAUDE.md'}
        title={
          draft.hasClaude
            ? 'El proyecto ya tiene reglas FORTRESS'
            : 'Este proyecto aun no tiene CLAUDE.md'
        }
      />
    </div>
  )
}
