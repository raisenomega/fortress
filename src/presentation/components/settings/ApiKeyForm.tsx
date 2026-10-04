import { useState } from 'react'
import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import { saveApiKey } from '../../services/settings-service'
import { FIELD_CLASS } from '../common/LabeledField'
import { ApiKeyVerdictNote } from './ApiKeyVerdictNote'

interface ApiKeyFormProps {
  readonly submitLabel: string
  readonly onSaved: () => void
}

/** Pega la key, se valida contra la API y solo entonces se guarda cifrada. */
export function ApiKeyForm({ submitLabel, onSaved }: ApiKeyFormProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [verdict, setVerdict] = useState<ApiKeyVerdict | null>(null)

  async function submit(): Promise<void> {
    setBusy(true)
    setVerdict(null)
    try {
      const result = await saveApiKey(draft)
      setVerdict(result.ok ? result.value : { status: 'invalida', reason: result.error })
      if (result.ok) {
        setDraft('')
        onSaved()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="password"
          value={draft}
          autoFocus
          aria-label="API key de Claude"
          placeholder="sk-ant-..."
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void submit()}
          className={`${FIELD_CLASS} font-mono`}
        />
        <button
          type="button"
          disabled={busy || draft.trim().length === 0}
          onClick={() => void submit()}
          className="tap shrink-0 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
        >
          {busy ? 'Verificando...' : submitLabel}
        </button>
      </div>

      {verdict ? <ApiKeyVerdictNote verdict={verdict} /> : null}
    </div>
  )
}
