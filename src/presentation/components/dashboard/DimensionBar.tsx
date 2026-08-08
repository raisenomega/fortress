import { dimensionTone } from './dimension-tones'

interface DimensionBarProps {
  readonly label: string
  readonly score: number | null
  /** Navega a los hallazgos que bajaron esta dimension. */
  readonly onOpen: () => void
}

export function DimensionBar({ label, score, onOpen }: DimensionBarProps): React.JSX.Element {
  const tone = dimensionTone(score)

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`Ver hallazgos de ${label}`}
      className="tap flex w-full items-center gap-2 text-left hover:opacity-80"
    >
      <span className="w-20 shrink-0 truncate text-[11px] text-muted-foreground">{label}</span>
      <span className="relative h-1.5 flex-1 overflow-hidden rounded bg-muted">
        <span
          className={`absolute inset-y-0 left-0 rounded ${tone.bar}`}
          style={{ width: `${tone.width}%` }}
        />
      </span>
      <span className={`w-16 shrink-0 text-right text-[11px] font-semibold ${tone.text}`}>
        {tone.label}
      </span>
    </button>
  )
}
