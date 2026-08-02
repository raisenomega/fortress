interface LabeledFieldProps {
  readonly label: string
  readonly children: React.ReactNode
}

export function LabeledField({ label, children }: LabeledFieldProps): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

/** Clase compartida por los inputs de los formularios. */
export const FIELD_CLASS =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground'
