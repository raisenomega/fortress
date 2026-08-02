import { Icon } from '../common/Icon'

interface PlanStepRowProps {
  readonly order: number
  readonly name: string
  readonly task: string
  readonly excluded: boolean
  readonly gate: boolean
}

/** El paso excluido se ensena tachado: hay que ver lo que NO se va a hacer. */
export function PlanStepRow({
  order,
  name,
  task,
  excluded,
  gate
}: PlanStepRowProps): React.JSX.Element {
  return (
    <li className={`flex items-start gap-2 text-xs ${excluded ? 'opacity-45' : ''}`}>
      <span className="w-4 shrink-0 font-mono text-muted-foreground">{order}</span>
      <span className={`shrink-0 font-semibold text-foreground ${excluded ? 'line-through' : ''}`}>
        {name}
      </span>
      {gate ? (
        <span title="Si encuentra CRITICAL, el workflow se detiene aqui">
          <Icon name="shield-off" size={11} className="mt-0.5 text-critical" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{task}</span>
    </li>
  )
}
