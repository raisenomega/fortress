import { EMPTY_COUNTS } from '@domain/project/severity-counts'
import { SEVERITIES, type Severity } from '@domain/shared/severity'
import { useScanStore } from '../../stores/scan-store'
import { BarChart, type Bar } from '../charts/BarChart'

const TONE: Record<Severity, string> = {
  CRITICAL: 'bg-critical',
  HIGH: 'bg-high',
  MEDIUM: 'bg-medium',
  LOW: 'bg-low'
}

/**
 * Hallazgos abiertos ahora mismo en todos los proyectos. Es una foto del
 * estado actual, no del periodo: los hallazgos se sustituyen en cada escaneo,
 * asi que no hay un "hallazgos de la semana pasada" que ensenar.
 */
export function SeverityChart(): React.JSX.Element {
  const counts = useScanStore((state) => state.counts)

  const totals = { ...EMPTY_COUNTS } as Record<Severity, number>
  for (const perProject of Object.values(counts)) {
    for (const severity of SEVERITIES) totals[severity] += perProject[severity]
  }

  const bars: Bar[] = SEVERITIES.map((severity) => ({
    label: severity,
    value: totals[severity],
    className: TONE[severity]
  }))

  return <BarChart bars={bars} empty="Ningun hallazgo abierto en ningun proyecto." />
}
