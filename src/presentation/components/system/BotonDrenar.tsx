import { useRepairStore } from '../../stores/repair-store'
import { useConfirmarDrenaje } from '../../hooks/useConfirmarDrenaje'
import { ConfirmDrenaje } from './ConfirmDrenaje'
import { Icon } from '../common/Icon'

interface BotonDrenarProps {
  readonly projectId: string | null
  readonly className: string
  readonly disabled: boolean
}

/**
 * Arranca el drenaje, o lo para si ya corre. La confirmacion cuelga de AQUI y
 * no del panel porque es de este boton: quien pregunta es quien va a gastar.
 */
export function BotonDrenar({
  projectId,
  className,
  disabled
}: BotonDrenarProps): React.JSX.Element {
  const drenando = useRepairStore((state) => state.drenando)
  const cerco = useRepairStore((state) => state.cerco)
  const confirmar = useConfirmarDrenaje(projectId, drenando, cerco.elegibles)

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={confirmar.alPulsar}
        title="Recorre los hallazgos elegibles y deja cada fix esperando firma"
        className={className}
      >
        <span className={drenando ? 'animate-spin' : ''}>
          <Icon name={drenando ? 'refresh-cw' : 'play'} size={12} />
        </span>
        {drenando ? 'Drenando... (parar)' : 'Drenar los elegibles'}
      </button>

      {confirmar.preguntando ? (
        <ConfirmDrenaje
          cerco={cerco}
          topes={confirmar.topes}
          onCancel={confirmar.cerrar}
          onConfirm={confirmar.arrancar}
        />
      ) : null}
    </>
  )
}
