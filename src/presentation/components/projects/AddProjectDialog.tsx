import { useState } from 'react'
import type { NewProject } from '@domain/project/project'
import { api } from '../../adapters/fortress-api'
import { addProject } from '../../services/project-service'
import { Modal } from '../common/Modal'
import { ProjectDetected } from './ProjectDetected'
import { ProjectFormFields } from './ProjectFormFields'

const EMPTY: NewProject = {
  name: '',
  path: '',
  stack: '',
  gitRemote: null,
  gitBranch: null,
  hasClaude: false
}

interface AddProjectDialogProps {
  readonly onClose: () => void
}

export function AddProjectDialog({ onClose }: AddProjectDialogProps): React.JSX.Element {
  const [draft, setDraft] = useState<NewProject>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  async function pickFolder(): Promise<void> {
    const picked = await api().projects.pickFolder()
    if (!picked) return
    setDraft(picked)
    setError(null)
  }

  async function submit(): Promise<void> {
    const result = await addProject(draft)
    if (!result.ok) return setError(result.error)
    onClose()
  }

  return (
    <Modal title="Agregar proyecto a FORTRESS" onClose={onClose}>
      <ProjectFormFields draft={draft} onChange={setDraft} onPickFolder={() => void pickFolder()} />
      <ProjectDetected draft={draft} />

      {error ? <p className="mt-3 text-xs text-critical">{error}</p> : null}

      <footer className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="tap rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={draft.path.length === 0 || draft.name.trim().length === 0}
          onClick={() => void submit()}
          className="tap rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
        >
          Agregar proyecto
        </button>
      </footer>
    </Modal>
  )
}
