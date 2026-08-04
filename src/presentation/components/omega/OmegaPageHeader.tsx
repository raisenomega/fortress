interface OmegaPageHeaderProps {
  readonly name: string
  readonly subtitle: string
  /** Efectividad/score 0-100 o null. */
  readonly score: number | null
  readonly runs: number
  readonly tokens: number
}

/** Cabecera del agente: nombre, subtitulo, cifras y barra de efectividad a 1/4. */
export function OmegaPageHeader(props: OmegaPageHeaderProps): React.JSX.Element {
  const { name, subtitle, score, runs, tokens } = props
  const tone = score !== null && score >= 75 ? 'bg-success' : 'bg-critical'

  return (
    <header className="space-y-2 rounded-md border border-primary/30 bg-card p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-base font-semibold text-foreground">{name}</h2>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {runs} ejecuciones · Score {score === null ? 's/d' : `${score}%`} · {tokens} tokens
        consumidos
      </p>
      <div className="w-1/4 min-w-[140px] space-y-1">
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Efectividad</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full ${tone}`} style={{ width: `${score ?? 0}%` }} />
        </div>
      </div>
    </header>
  )
}
