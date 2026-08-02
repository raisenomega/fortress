interface EmptyStateProps {
  readonly icon: string
  readonly title: string
  readonly hint: string
  readonly children?: React.ReactNode
}

export function EmptyState({ icon, title, hint, children }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      <span className="text-3xl opacity-70">{icon}</span>
      <h3 className="text-base text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
      {children}
    </div>
  )
}
