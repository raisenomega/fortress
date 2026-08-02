import type { CognitionPattern } from '@domain/cognition/cognition-log'
import { PatternCard } from './PatternCard'

interface PatternListProps {
  readonly patterns: readonly CognitionPattern[]
}

export function PatternList({ patterns }: PatternListProps): React.JSX.Element {
  if (patterns.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Sin patrones registrados. Los escribe COGNITION en el log, no esta app.
      </p>
    )
  }

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {patterns.map((pattern) => (
        <PatternCard key={pattern.id} pattern={pattern} />
      ))}
    </div>
  )
}
