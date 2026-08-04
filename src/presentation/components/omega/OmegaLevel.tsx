interface OmegaLevelProps {
  readonly n: number
  readonly title: string
  readonly children: React.ReactNode
}

/** Un nivel de profundidad dentro de una barra lateral (patron del spec). */
export function OmegaLevel({ n, title, children }: OmegaLevelProps): React.JSX.Element {
  return (
    <div className="space-y-1">
      <p className="text-[10px] tracking-widest text-primary uppercase">
        Nivel {n} · {title}
      </p>
      <div className="text-xs text-muted-foreground">{children}</div>
    </div>
  )
}
