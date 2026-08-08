import { Icon } from '../common/Icon'

interface QualityButtonProps {
  readonly running: boolean
  /** Solo se audita un proyecto a la vez: corre probes pesados. */
  readonly busyElsewhere: boolean
  /** Sin confianza no corren los probes: quedaria PARCIAL sin sentido. */
  readonly trusted: boolean
  readonly onAudit: () => void
}

export function QualityButton({
  running,
  busyElsewhere,
  trusted,
  onAudit
}: QualityButtonProps): React.JSX.Element {
  const label = running ? 'Auditando...' : 'Auditar calidad'
  const title = !trusted
    ? 'Marca el proyecto como De confianza para correr los probes'
    : 'Mide las 6 dimensiones (tsc, lint, build, tests, deps, operacion)'

  return (
    <button
      type="button"
      onClick={onAudit}
      disabled={running || busyElsewhere || !trusted}
      title={title}
      className="tap flex items-center gap-2 rounded-md border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
    >
      <Icon name={running ? 'zap' : 'gauge'} size={13} />
      {label}
    </button>
  )
}
