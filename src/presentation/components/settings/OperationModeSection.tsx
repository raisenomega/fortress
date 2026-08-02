import { PROTECTED_AREAS } from '@domain/settings/operation-mode'
import { ModeSelector } from './ModeSelector'

export function OperationModeSection(): React.JSX.Element {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-base">Modo de operacion</h3>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        En supervisado el agente propone y espera tu aprobacion. En autonomo aplica los cambios y
        reporta, pero vuelve a supervisado por su cuenta en cuanto la peticion menciona{' '}
        <span className="text-foreground">{PROTECTED_AREAS.join(', ')}</span>.
      </p>
      <ModeSelector />
    </section>
  )
}
