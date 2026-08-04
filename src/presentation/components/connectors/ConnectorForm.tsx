import { addConnector } from '../../services/connectors-service'
import { useConnectorsStore } from '../../stores/connectors-store'
import { ConnectorFormFields } from './ConnectorFormFields'

/** Anade un MCP propio. Solo https: la validacion vive en el dominio. */
export function ConnectorForm(): React.JSX.Element {
  const draft = useConnectorsStore((state) => state.draft)
  const saving = useConnectorsStore((state) => state.saving)
  const incompleto = draft.name.trim() === '' || draft.url.trim() === ''

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="font-display text-sm font-bold text-foreground">Anadir un MCP propio</h3>

      <ConnectorFormFields />

      <button
        type="button"
        disabled={saving || incompleto}
        onClick={() => void addConnector()}
        className="tap rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Anadir conector'}
      </button>
    </div>
  )
}
