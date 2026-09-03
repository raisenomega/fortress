import type { SelfObservation } from '@domain/system/self-observation'

interface ObservationCardProps {
  readonly observation: SelfObservation
}

/**
 * Solo lectura a proposito. Tuvo un boton de "marcar atendido" que en semanas no
 * se pulso ni una vez: cerrar trescientas cuarenta observaciones a mano no es
 * trabajo de una tarjeta. Ahora se cierran fuera y entran por el registro.
 */
export function ObservationCard({ observation }: ObservationCardProps): React.JSX.Element {
  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <header className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
          {observation.kind}
        </span>
        <span className="text-[11px] text-muted-foreground">{observation.area}</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          desde {observation.sourceProject}
        </span>
      </header>

      <p className="mt-1.5 text-sm text-foreground">{observation.note}</p>
    </article>
  )
}
