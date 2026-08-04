interface OmegaSectionProps {
  readonly title: string
  readonly children: React.ReactNode
}

/** Bloque titulado del superdashboard. Mismo estilo que el resto de paneles. */
export function OmegaSection({ title, children }: OmegaSectionProps): React.JSX.Element {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}
