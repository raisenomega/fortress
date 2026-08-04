export interface Field {
  readonly label: string
  readonly value: string
}

interface OmegaFieldGridProps {
  readonly fields: readonly Field[]
}

/** Grid de campos informativos reutilizable (patron de diseno del spec). */
export function OmegaFieldGrid({ fields }: OmegaFieldGridProps): React.JSX.Element {
  return (
    <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      {fields.map((field) => (
        <div key={field.label} className="rounded-md border border-border bg-card px-2 py-1.5">
          <dt className="text-muted-foreground">{field.label}</dt>
          <dd className="text-foreground">{field.value}</dd>
        </div>
      ))}
    </dl>
  )
}
