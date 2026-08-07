import { useEffect, useState } from 'react'
import { loadDocs, readDoc } from '../../services/docs-service'
import { useActiveProject } from '../../stores/project-store'
import { EmptyState } from '../common/EmptyState'
import { DocsList } from './DocsList'

/**
 * Visor de documentacion del proyecto: lee los .md de la raiz (incluido el marco
 * interno gitignorado) sin salir de FORTRESS ni abrir la carpeta a mano.
 */
export function DocsView(): React.JSX.Element {
  const projectId = useActiveProject()?.id
  const [docs, setDocs] = useState<readonly string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!projectId) return
    void loadDocs(projectId).then((list) => {
      setDocs(list)
      setSelected((current) => current ?? list[0] ?? null)
    })
  }, [projectId])

  useEffect(() => {
    if (projectId && selected) void readDoc(projectId, selected).then(setContent)
  }, [projectId, selected])

  if (!projectId) {
    return (
      <EmptyState
        iconName="file-text"
        title="Ningun proyecto"
        hint="Elige un proyecto en la barra lateral para leer su documentacion."
      />
    )
  }

  return (
    <div className="flex h-full min-h-0">
      <DocsList docs={docs} selected={selected} onSelect={setSelected} />
      <pre className="min-h-0 flex-1 overflow-auto p-4 text-xs break-words whitespace-pre-wrap text-foreground">
        {content || 'Este proyecto aun no tiene documentos .md en la raiz.'}
      </pre>
    </div>
  )
}
