import { AUTH_HINT, AUTH_LABEL, AUTH_SOURCES } from '@domain/settings/auth-source'
import { chooseAuthSource, connectAccount } from '../../services/account-service'
import { useAccountStore } from '../../stores/account-store'
import { AccountStatus } from './AccountStatus'

/**
 * La cuenta va primero y la API key despues, porque ese es el orden correcto:
 * la suscripcion no cuesta dinero aparte y la key si. Al reves, cualquiera que
 * pegara una clave se quedaba pagando sin haberlo decidido.
 */
export function AccountSection(): React.JSX.Element {
  const source = useAccountStore((state) => state.source)
  const account = useAccountStore((state) => state.account)

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <header>
        <h3 className="text-sm font-semibold text-foreground">Cuenta de Claude</h3>
        <p className="text-xs text-muted-foreground">
          Con que credenciales ejecuta FORTRESS los agentes. Es la misma sesion que usa
          <code className="mx-1 font-mono">claude</code> en tu terminal.
        </p>
      </header>

      <AccountStatus account={account} onConnect={() => void connectAccount()} />

      <div className="space-y-1.5">
        {AUTH_SOURCES.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 ${
              source === option ? 'border-primary/50 bg-accent/20' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="auth-source"
              checked={source === option}
              onChange={() => void chooseAuthSource(option)}
              className="mt-0.5"
            />
            <span className="min-w-0">
              <span className="block text-sm text-foreground">{AUTH_LABEL[option]}</span>
              <span className="block text-xs text-muted-foreground">{AUTH_HINT[option]}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}
