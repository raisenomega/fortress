import { useEffect } from 'react'
import { loadConnectors } from '../../services/connectors-service'
import { useConnectorsStore } from '../../stores/connectors-store'
import { Notice } from '../common/Notice'
import { ConnectorForm } from './ConnectorForm'
import { ConnectorRow } from './ConnectorRow'

/**
 * Servidores MCP que se le pasan a Claude Code. Encender uno le da al agente
 * acceso real a ese servicio, por eso todos arrancan apagados y el punto solo
 * se pone verde cuando ademas hay endpoint.
 */
export function ConnectorsView(): React.JSX.Element {
  const items = useConnectorsStore((state) => state.items)
  const error = useConnectorsStore((state) => state.error)

  useEffect(() => {
    void loadConnectors()
  }, [])

  return (
    <div className="h-full space-y-4 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="font-display text-lg font-bold text-foreground">Conectores</h2>
        <p className="text-xs text-muted-foreground">
          Servidores MCP que los agentes pueden usar. Activar uno le da acceso real a ese servicio:
          enciende solo los que uses.
        </p>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <ul className="space-y-2">
        {items.map((connector) => (
          <ConnectorRow key={connector.id} connector={connector} />
        ))}
      </ul>

      <ConnectorForm />
    </div>
  )
}
