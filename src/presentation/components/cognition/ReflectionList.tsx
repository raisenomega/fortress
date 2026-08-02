import type { CognitionReflection } from '@domain/cognition/cognition-log'
import { ReflectionItem } from './ReflectionItem'

const MAX = 5

interface ReflectionListProps {
  readonly reflections: readonly CognitionReflection[]
}

export function ReflectionList({ reflections }: ReflectionListProps): React.JSX.Element {
  if (reflections.length === 0) {
    return <p className="text-xs text-muted-foreground">Ninguna sesion registrada todavia.</p>
  }

  return (
    <ul className="space-y-1.5">
      {reflections.slice(0, MAX).map((reflection) => (
        <ReflectionItem key={reflection.session + reflection.project} reflection={reflection} />
      ))}
    </ul>
  )
}
