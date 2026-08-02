import { WINDOW_LABEL, WINDOWS, type TimeWindow } from '@domain/telemetry/time-window'

interface WindowPickerProps {
  readonly current: TimeWindow
  readonly onPick: (window: TimeWindow) => void
}

export function WindowPicker({ current, onPick }: WindowPickerProps): React.JSX.Element {
  return (
    <div className="flex gap-1">
      {WINDOWS.map((window) => (
        <button
          key={window}
          type="button"
          onClick={() => onPick(window)}
          aria-pressed={window === current}
          className={`tap rounded-md px-2.5 py-1 text-xs ${
            window === current
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {WINDOW_LABEL[window]}
        </button>
      ))}
    </div>
  )
}
