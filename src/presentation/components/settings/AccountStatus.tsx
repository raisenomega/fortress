import type { Account } from '@domain/settings/account'
import { useAccountStore } from '../../stores/account-store'
import { Icon } from '../common/Icon'

interface AccountStatusProps {
  readonly account: Account
  readonly onConnect: () => void
}

export function AccountStatus({ account, onConnect }: AccountStatusProps): React.JSX.Element {
  const output = useAccountStore((state) => state.loginOutput)

  return (
    <div className="space-y-2">
      {account.loggedIn ? (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-foreground">
          <Icon name="check-circle" size={13} className="text-success" />
          Conectado como <span className="font-mono text-primary">{account.email}</span>
          {account.plan ? (
            <span className="text-muted-foreground">· plan {account.plan}</span>
          ) : null}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">No hay ninguna cuenta conectada.</p>
          <button
            type="button"
            onClick={onConnect}
            className="tap rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
          >
            Conectar cuenta
          </button>
        </div>
      )}

      {/* La salida del CLI a la vista: puede pedir abrir una URL o pegar un codigo. */}
      {output === '' ? null : (
        <pre className="max-h-32 overflow-y-auto rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-[11px] whitespace-pre-wrap text-muted-foreground">
          {output}
        </pre>
      )}
    </div>
  )
}
