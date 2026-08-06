import type { Project } from '@domain/project/project'
import { setProjectTrusted } from '../../services/project-service'

interface TrustToggleProps {
  readonly project: Project
}

/**
 * Confianza del proyecto. Por defecto NO: el agente no auto-ejecuta scripts del
 * repo (`npm run X` es codigo del propio repo). Marcarlo de confianza habilita
 * que se autoverifique (typecheck/lint/test) tras editar. Un click lo cambia.
 */
export function TrustToggle({ project }: TrustToggleProps): React.JSX.Element {
  const trusted = project.trusted
  const tone = trusted ? 'border-success/40 text-success' : 'border-medium/40 text-medium'

  return (
    <button
      type="button"
      onClick={() => void setProjectTrusted(project.id, !trusted)}
      title={
        trusted
          ? 'De confianza: el agente puede autoverificarse (typecheck/lint/test). Click para revocar.'
          : 'No confiable: el agente NO auto-ejecuta scripts del repo. Click para marcar de confianza.'
      }
      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase ${tone}`}
    >
      {trusted ? 'De confianza' : 'No confiable'}
    </button>
  )
}
