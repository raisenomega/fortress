interface OmegaPageHeaderProps {
  readonly name: string
  readonly subtitle: string
  /** Efectividad 0-100 o null. */
  readonly effectiveness: number | null
  readonly runs: number
  readonly tokens: number
}

/** Cabecera de la pagina del agente: nombre, subtitulo, barra de efectividad, cifras. */
export function OmegaPageHeader(props: OmegaPageHeaderProps): React.JSX.Element {
  const { name, subtitle, effectiveness, runs, tokens } = props
  const tone = effectiveness !== null && effectiveness >= 75 ? 'bg-success' : 'bg-critical'

  return (
    <header className="space-y-2 rounded-md border border-primary/30 bg-card p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-base font-semibold text-foreground">{name}</h2>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {runs} ejecuciones · {tokens} tokens consumidos
        </span>
      </div>
      <div className="space-y-1">
        <p className="flex justify-between text-[10px] tracking-wide text-muted-foreground uppercase">
          <span>Efectividad</span>
          <span>{effectiveness === null ? 's/d' : `${effectiveness}%`}</span>
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full ${tone}`} style={{ width: `${effectiveness ?? 0}%` }} />
        </div>
      </div>
    </header>
  )
}
