import { ModeSelector } from './ModeSelector'

export function OperationModeSection(): React.JSX.Element {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-base">Modo de operacion</h3>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        En supervisado el agente propone y espera tu aprobacion. En autonomo aplica los cambios y
        reporta, sobre los proyectos que marcaste de confianza. Vuelve a supervisado por su cuenta
        en tres casos:{' '}
        <span className="text-foreground">
          el codigo de FORTRESS, un proyecto sin confianza, o uno sin repositorio git
        </span>{' '}
        — sin git no hay con que deshacer lo que deje.
      </p>
      <ModeSelector />
    </section>
  )
}
