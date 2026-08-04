import { CREATE_AT, OFFICIAL_AT, TRIAL_END } from '@domain/system/capability'

interface MaturityBarProps {
  readonly episodes: number
}

const MARKS: ReadonlyArray<{ at: number; label: string }> = [
  { at: CREATE_AT, label: '1k' },
  { at: TRIAL_END, label: '20k' },
  { at: OFFICIAL_AT, label: '50k' }
]

/** Camino de episodios hacia oficial (50.000). La barra mide el progreso REAL;
 *  las marcas 1k/20k/50k van en su fraccion verdadera, no equiespaciadas. */
export function MaturityBar({ episodes }: MaturityBarProps): React.JSX.Element {
  const pct = Math.min(100, (episodes / OFFICIAL_AT) * 100)
  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="relative mt-1 h-3 text-[10px] text-muted-foreground">
        {MARKS.map((mark) => (
          <span
            key={mark.label}
            className="absolute -translate-x-1/2"
            style={{ left: `${(mark.at / OFFICIAL_AT) * 100}%` }}
          >
            {mark.label}
          </span>
        ))}
      </div>
    </div>
  )
}
