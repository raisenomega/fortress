import { CATEGORY_LABEL, isConnected, type ConnectorState } from '@domain/connectors/connector'
import { removeConnector, toggleConnector } from '../../services/connectors-service'
import { Icon } from '../common/Icon'
import { Toggle } from '../common/Toggle'

interface ConnectorRowProps {
  readonly connector: ConnectorState
}

/** Punto verde solo si de verdad puede conectar: activo y con endpoint. */
export function ConnectorRow({ connector }: ConnectorRowProps): React.JSX.Element {
  const live = isConnected(connector)

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <span
        aria-label={live ? 'Conectado' : 'Sin configurar'}
        title={live ? 'Conectado' : 'Sin configurar'}
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${live ? 'bg-success' : 'bg-muted'}`}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {connector.name}
          <span className="ml-2 text-[10px] font-normal text-muted-foreground">
            {CATEGORY_LABEL[connector.category]}
          </span>
        </p>
        <p className="text-xs break-words text-muted-foreground">{connector.description}</p>
        {connector.url ? (
          <p className="truncate font-mono text-[10px] text-muted-foreground">{connector.url}</p>
        ) : null}
      </div>

      <Toggle
        checked={connector.enabled}
        label={`Activar ${connector.name}`}
        onChange={() => void toggleConnector(connector.id, !connector.enabled)}
      />

      {connector.builtin ? null : (
        <button
          type="button"
          title={`Eliminar ${connector.name}`}
          aria-label={`Eliminar ${connector.name}`}
          onClick={() => void removeConnector(connector.id)}
          className="tap rounded p-1 text-muted-foreground hover:text-critical"
        >
          <Icon name="x-circle" size={14} />
        </button>
      )}
    </li>
  )
}
