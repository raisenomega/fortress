import { useSettingsStore } from '../../stores/settings-store'

interface OmegaProfileHeaderProps {
  readonly band: string
  readonly tone: string
  readonly lastAudit: string | null
  readonly projectName: string
}

/** Cabecera del perfil (spec §3): estado, ultima auditoria, proyecto, modelo, modo. */
export function OmegaProfileHeader({
  band,
  tone,
  lastAudit,
  projectName
}: OmegaProfileHeaderProps): React.JSX.Element {
  const mode = useSettingsStore((state) => state.mode)

  return (
    <div className="space-y-1 rounded-md border border-border bg-card p-3 text-xs">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full bg-current ${tone}`} />
        <span className={`font-semibold tracking-wide uppercase ${tone}`}>{band}</span>
        <span className="ml-auto text-muted-foreground">
          Ultima auditoria: {lastAudit ?? '—'}
        </span>
      </div>
      <p className="text-muted-foreground">
        Proyecto: <span className="text-foreground">{projectName}</span> · Modelo: sesion de Claude
        Code · Modo: <span className="text-foreground">{mode}</span>
      </p>
    </div>
  )
}
