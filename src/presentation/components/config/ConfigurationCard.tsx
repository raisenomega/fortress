import { DRAFTED_DOCS } from '@domain/chat/config-docs'
import { useProjectStreaming } from '../../stores/chat-selectors'
import { useConfigurationStore } from '../../stores/configuration-store'
import { ConfigActions } from './ConfigActions'
import { ConfigDocPreview } from './ConfigDocPreview'

interface ConfigurationCardProps {
  readonly projectId: string
}

/**
 * Fase de aprobacion del marco: el operador aprueba los 7 documentos uno a uno
 * (el agente los propone en el chat) y ejecuta la escritura. REGLA INVIOLABLE:
 * nada se escribe en disco sin "Si, ejecutar".
 */
export function ConfigurationCard({ projectId }: ConfigurationCardProps): React.JSX.Element {
  const drafts = useConfigurationStore((s) => s.drafts[projectId] ?? {})
  const approved = useConfigurationStore((s) => s.approved[projectId] ?? 0)
  const executing = useConfigurationStore((s) => s.executing[projectId] ?? false)
  const streaming = useProjectStreaming(projectId)

  const total = DRAFTED_DOCS.length
  const ready = approved >= total
  const currentDoc = ready ? null : DRAFTED_DOCS[approved]
  const content = currentDoc ? drafts[currentDoc] : undefined

  return (
    <section className="mx-4 mb-3 rounded-lg border border-primary/40 bg-card p-4">
      <p className="text-xs font-semibold text-primary uppercase">
        Marco del proyecto ·{' '}
        {ready ? 'listo para escribir' : `documento ${approved + 1} de ${total}`}
      </p>
      {currentDoc ? (
        <ConfigDocPreview name={currentDoc} content={content} />
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Los {total} documentos estan aprobados. Al ejecutar, FORTRESS los escribe y hace el
          commit.
        </p>
      )}
      <ConfigActions
        projectId={projectId}
        ready={ready}
        canApprove={Boolean(content?.trim()) && !streaming}
        executing={executing}
        busy={streaming}
      />
    </section>
  )
}
