interface CampoGitProps {
  readonly value: string
  readonly onChange: (v: string) => void
  readonly placeholder: string
}

/** Un input de texto para los ajustes de git del proyecto (PASO 163). */
export function CampoGit({ value, onChange, placeholder }: CampoGitProps): React.JSX.Element {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
    />
  )
}
