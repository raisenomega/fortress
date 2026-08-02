import { useState } from 'react'
import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import { checkApiKey, clearApiKey } from '../../services/settings-service'
import { useSettingsStore } from '../../stores/settings-store'
import { ApiKeyForm } from './ApiKeyForm'
import { ApiKeyVerdictNote } from './ApiKeyVerdictNote'

export function ApiKeySection(): React.JSX.Element {
  const hasApiKey = useSettingsStore((state) => state.hasApiKey)
  const [verdict, setVerdict] = useState<ApiKeyVerdict | null>(null)

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-base">API key de Claude</h3>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Se verifica contra la API, se cifra con el keychain del sistema y se guarda solo en este
        equipo. Nunca sale de tu maquina ni se escribe en el repositorio.
      </p>

      <ApiKeyForm
        submitLabel={hasApiKey ? 'Reemplazar' : 'Guardar'}
        onSaved={() => setVerdict(null)}
      />

      {hasApiKey ? (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void checkApiKey().then(setVerdict)}
            className="tap rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Probar la key guardada
          </button>
          <button
            type="button"
            onClick={() => void clearApiKey().then(() => setVerdict(null))}
            className="tap rounded-md px-3 py-1.5 text-xs text-critical hover:bg-critical/10"
          >
            Borrar la key guardada
          </button>
        </div>
      ) : null}

      {verdict ? <ApiKeyVerdictNote verdict={verdict} /> : null}
    </section>
  )
}
