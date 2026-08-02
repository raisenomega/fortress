import { usePostureStore } from '../../stores/posture-store'
import { Notice } from '../common/Notice'
import { PostureForm } from './PostureForm'
import { PostureResultView } from './PostureResultView'

/**
 * Superficie externa: como te ve el mundo desde fuera. Mira, no ataca. La
 * cabecera lo deja claro para que nadie lo confunda con una herramienta
 * ofensiva: aqui no se lanza volumen ni cargas que rompan nada.
 */
export function PostureView(): React.JSX.Element {
  const error = usePostureStore((state) => state.error)

  return (
    <div className="h-full space-y-4 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="font-display text-lg font-bold text-foreground">Superficie externa</h2>
        <p className="text-xs text-muted-foreground">
          Revisa tu sitio desde fuera y te dice que puertas cerrar. Solo lectura: ninguna carga que
          modifique nada, ningun ataque de volumen.
        </p>
      </header>

      <PostureForm />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <PostureResultView />
    </div>
  )
}
