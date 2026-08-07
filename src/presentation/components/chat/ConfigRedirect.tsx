import { useUiStore } from '../../stores/ui-store'

interface ConfigRedirectProps {
  readonly projectName: string
}

const BTN = 'tap rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'

/** Un proyecto sin marco aprobado se configura en "Construir", no en el chat. */
export function ConfigRedirect({ projectName }: ConfigRedirectProps): React.JSX.Element {
  const setView = useUiStore((state) => state.setView)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-foreground">{projectName} se esta configurando.</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Completa la entrevista y aprueba el marco en Construir. Cuando este listo, el chat se abre
        para trabajar en el proyecto.
      </p>
      <button type="button" onClick={() => setView('construir')} className={BTN}>
        Ir a Construir
      </button>
    </div>
  )
}
