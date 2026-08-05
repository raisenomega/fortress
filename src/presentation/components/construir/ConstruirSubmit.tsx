import { Icon } from '../common/Icon'
import { useConstruirStore } from '../../stores/construir-store'
import { stopBuild, submitConstruir } from '../../services/construir-service'

interface ConstruirSubmitProps {
  readonly projectId: string
}

/** Boton a la derecha de la flecha: enviar (Enter tambien) o Detener si trabaja. */
export function ConstruirSubmit({ projectId }: ConstruirSubmitProps): React.JSX.Element {
  const busy = useConstruirStore((s) => s.busy)

  if (busy) {
    return (
      <button
        type="button"
        onClick={() => void stopBuild(projectId)}
        className="tap rounded-md border border-critical/40 px-2 py-1.5 text-xs text-critical hover:bg-critical/10"
      >
        Detener
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => submitConstruir(projectId)}
      title="Enviar"
      className="tap bg-transparent p-1 text-primary hover:text-primary-hover"
    >
      <Icon name="send" size={18} />
    </button>
  )
}
