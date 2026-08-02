import { useState } from 'react'
import { clearApiKey, saveApiKey } from '../../services/settings-service'
import { useSettingsStore } from '../../stores/settings-store'
import { Modal } from '../common/Modal'
import { ApiKeyActions } from './ApiKeyActions'

interface ApiKeyDialogProps {
  readonly onClose: () => void
}

export function ApiKeyDialog({ onClose }: ApiKeyDialogProps): React.JSX.Element {
  const hasApiKey = useSettingsStore((state) => state.hasApiKey)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(): Promise<void> {
    const failure = await saveApiKey(draft)
    if (failure) return setError(failure)
    onClose()
  }

  return (
    <Modal title="API key de Claude" onClose={onClose}>
      <p className="mb-3 text-sm text-muted-foreground">
        Se cifra con el keychain del sistema y se guarda solo en este equipo. Nunca sale del proceso
        principal ni se escribe en el repositorio.
      </p>

      <input
        type="password"
        value={draft}
        autoFocus
        placeholder={
          hasApiKey ? 'Hay una key configurada — escribe otra para cambiarla' : 'sk-ant-...'
        }
        onChange={(event) => setDraft(event.target.value)}
        className="w-full rounded-md border border-border bg-input px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground"
      />

      {error ? <p className="mt-2 text-xs text-critical">{error}</p> : null}

      <ApiKeyActions
        hasApiKey={hasApiKey}
        canSave={draft.trim().length > 0}
        onClear={() => void clearApiKey().then(onClose)}
        onCancel={onClose}
        onSave={() => void submit()}
      />
    </Modal>
  )
}
