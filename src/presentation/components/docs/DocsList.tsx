interface DocsListProps {
  readonly docs: readonly string[]
  readonly selected: string | null
  readonly onSelect: (name: string) => void
}

/** Columna de nombres de .md; el marco interno (CONSTITUTION, etc.) tambien
 *  aparece aunque no se commitee, para poder leerlo sin salir de FORTRESS. */
export function DocsList({ docs, selected, onSelect }: DocsListProps): React.JSX.Element {
  return (
    <nav className="w-56 shrink-0 space-y-0.5 overflow-y-auto border-r border-border p-2">
      {docs.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelect(name)}
          className={`tap block w-full truncate rounded px-2 py-1 text-left font-mono text-xs ${
            name === selected
              ? 'bg-accent/40 text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {name}
        </button>
      ))}
    </nav>
  )
}
