interface OmegaProjectChipsProps {
  readonly projects: ReadonlyArray<{ readonly id: string; readonly name: string }>
  readonly active: string | null
  readonly onSelect: (id: string | null) => void
}

const chip = (on: boolean): string =>
  `tap rounded-full border px-2 py-0.5 text-[11px] ${on ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`

/** Chips de proyecto: click filtra el historial a ese proyecto (spec). */
export function OmegaProjectChips({
  projects,
  active,
  onSelect
}: OmegaProjectChipsProps): React.JSX.Element | null {
  if (projects.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => onSelect(null)} className={chip(active === null)}>
        Todos
      </button>
      {projects.map((project) => (
        <button
          key={project.id}
          type="button"
          onClick={() => onSelect(project.id)}
          className={chip(active === project.id)}
        >
          {project.name}
        </button>
      ))}
    </div>
  )
}
