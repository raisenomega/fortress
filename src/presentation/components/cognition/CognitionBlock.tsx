interface CognitionBlockProps {
  readonly title: string
  readonly children: React.ReactNode
}

export function CognitionBlock({ title, children }: CognitionBlockProps): React.JSX.Element {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}
