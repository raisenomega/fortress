import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { Finding } from '@domain/project/project'
import { OmegaEvidence } from './OmegaEvidence'
import { OmegaLevel } from './OmegaLevel'

interface OmegaFindingLevelsProps {
  readonly finding: Finding
  readonly snippet: FileSnippet | null
  readonly loc: string
}

/** Los cinco niveles de una vulnerabilidad; el panel solo pone el marco. */
export function OmegaFindingLevels({
  finding,
  snippet,
  loc
}: OmegaFindingLevelsProps): React.JSX.Element {
  return (
    <>
      <OmegaLevel n={1} title="Resumen">
        {finding.title}
      </OmegaLevel>
      <OmegaLevel n={2} title="Ubicacion">
        <span className="font-mono">{loc}</span>
      </OmegaLevel>
      <OmegaLevel n={3} title="Evidencia en el archivo">
        {finding.line !== null ? (
          snippet ? (
            <OmegaEvidence snippet={snippet} />
          ) : (
            'Cargando…'
          )
        ) : (
          's/d'
        )}
      </OmegaLevel>
      <OmegaLevel n={4} title="Verificacion de OMEGA">
        {snippet
          ? snippet.found
            ? 'El archivo:linea existe en disco.'
            : 'El archivo no existe: posible falso positivo.'
          : '—'}
      </OmegaLevel>
      <OmegaLevel n={5} title="Impacto / recomendacion">
        El escaner guarda severidad, archivo y linea; el impacto y el fix no se persisten (s/d).
      </OmegaLevel>
    </>
  )
}
