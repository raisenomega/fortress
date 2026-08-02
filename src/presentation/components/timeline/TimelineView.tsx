import { filterActivity, isFiltering } from '@domain/telemetry/filter-activity'
import { TIMELINE_LIMIT } from '../../services/timeline-service'
import { useActiveProject } from '../../stores/project-store'
import { useTimeline, useTimelineStore } from '../../stores/timeline-store'
import { EmptyState } from '../common/EmptyState'
import { TimelineEntry } from './TimelineEntry'
import { TimelineFilters } from './TimelineFilters'

export function TimelineView(): React.JSX.Element {
  const project = useActiveProject()
  const entries = useTimeline(project?.id ?? null)
  const filter = useTimelineStore((state) => state.filter)
  const setFilter = useTimelineStore((state) => state.setFilter)

  if (!project) {
    return <EmptyState iconName="zap" title="Ningun proyecto" hint="Elige un proyecto." />
  }

  const visible = filterActivity(entries, filter)

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden px-4 py-3">
      <TimelineFilters filter={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {isFiltering(filter)
            ? 'Ninguna entrada cumple ese filtro.'
            : 'Todavia no hay actividad en este proyecto. La generan los escaneos y el chat.'}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {visible.map((entry) => (
            <TimelineEntry key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      {/* Sin esto, un proyecto con mas actividad de la que cabe pareceria
          tener solo esto. Un tope silencioso se lee como "esto es todo". */}
      {entries.length >= TIMELINE_LIMIT ? (
        <p className="text-[11px] text-muted-foreground">
          Mostrando las {TIMELINE_LIMIT} entradas mas recientes.
        </p>
      ) : null}
    </div>
  )
}
