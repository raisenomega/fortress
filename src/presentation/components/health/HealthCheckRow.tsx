import { LEVEL_ICON, type HealthCheck } from '@domain/health/health-check'

const BORDER: Record<HealthCheck['level'], string> = {
  ok: 'border-border',
  warning: 'border-medium/40',
  error: 'border-critical/40'
}

interface HealthCheckRowProps {
  readonly check: HealthCheck
}

export function HealthCheckRow({ check }: HealthCheckRowProps): React.JSX.Element {
  return (
    <li className={`rounded-md border px-3 py-2 ${BORDER[check.level]}`}>
      <p className="flex items-center gap-2 text-sm text-foreground">
        <span aria-hidden>{LEVEL_ICON[check.level]}</span>
        {check.label}
      </p>
      <p className="mt-0.5 pl-6 text-xs text-muted-foreground">{check.detail}</p>
      {check.fix ? (
        <p className="mt-1 pl-6 text-xs text-primary">
          <span className="font-semibold">Como arreglarlo:</span> {check.fix}
        </p>
      ) : null}
    </li>
  )
}
