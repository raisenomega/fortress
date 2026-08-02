import { ApiKeyForm } from '../settings/ApiKeyForm'

interface OnboardingScreenProps {
  readonly onSkip: () => void
}

/** Primera pantalla cuando aun no hay API key configurada. */
export function OnboardingScreen({ onSkip }: OnboardingScreenProps): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg animate-[slideUp_0.25s_ease-out]">
        <h1 className="text-3xl text-primary">🏰 FORTRESS Command Center</h1>
        <h2 className="mt-6 text-lg">Pega tu API key para empezar</h2>
        <p className="mt-2 mb-5 text-sm text-muted-foreground">
          FORTRESS habla directamente con la API de Claude desde este equipo. La key se verifica, se
          cifra con el keychain del sistema y se guarda solo aqui:{' '}
          <span className="text-foreground">nunca sale de tu maquina</span>.
        </p>

        <ApiKeyForm submitLabel="Empezar" onSaved={onSkip} />

        <p className="mt-6 text-xs text-muted-foreground">
          Puedes crear una key en console.anthropic.com. Si prefieres usar la variable de entorno
          ANTHROPIC_API_KEY, exportala y reinicia la app.
        </p>

        <button
          type="button"
          onClick={onSkip}
          className="tap mt-4 text-xs text-muted-foreground underline hover:text-foreground"
        >
          Entrar sin configurar (el chat no funcionara)
        </button>
      </div>
    </div>
  )
}
