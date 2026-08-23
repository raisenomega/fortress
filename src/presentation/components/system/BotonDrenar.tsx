import { useState } from 'react'
import { drenar, pararDrenaje } from '../../services/drenaje-service'
import { useRepairStore } from '../../stores/repair-store'
import { useTopesDelDrenaje } from '../../hooks/useTopesDelDrenaje'
import { notify } from '../../stores/toast-store'
import { actoDeDrenar } from './acto-de-drenar'
import { ConfirmDrenaje } from './ConfirmDrenaje'
import { Icon } from '../common/Icon'

interface BotonDrenarProps {
  readonly projectId: string | null
  readonly className: string
  readonly disabled: boolean
}

/**
 * Arranca el drenaje, o lo para si ya corre. La confirmacion vive AQUI y no en
 * el panel porque es de este boton: quien pregunta es quien va a gastar.
 */
export function BotonDrenar({
  projectId,
  className,
  disabled
}: BotonDrenarProps): React.JSX.Element {
  const drenando = useRepairStore((state) => state.drenando)
  const elegibles = useRepairStore((state) => state.cerco.elegibles)
  const [preguntando, setPreguntando] = useState(false)
  const topes = useTopesDelDrenaje(preguntando)

  const alPulsar = (): void => {
    if (projectId === null) return
    const acto = actoDeDrenar(drenando, elegibles)
    if (acto === 'parar') return void pararDrenaje(projectId)
    if (acto === 'nada-que-drenar') {
      return notify('No hay nada que drenar: ningun hallazgo elegible.')
    }
    setPreguntando(true)
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={alPulsar}
        title="Recorre los hallazgos elegibles y deja cada fix esperando firma"
        className={className}
      >
        <span className={drenando ? 'animate-spin' : ''}>
          <Icon name={drenando ? 'refresh-cw' : 'play'} size={12} />
        </span>
        {drenando ? 'Drenando... (parar)' : 'Drenar los elegibles'}
      </button>

      {preguntando && projectId !== null ? (
        <ConfirmDrenaje
          elegibles={elegibles}
          costCapUsd={topes.costCapUsd}
          maxVueltas={topes.maxVueltas}
          onCancel={() => setPreguntando(false)}
          onConfirm={() => {
            setPreguntando(false)
            void drenar(projectId)
          }}
        />
      ) : null}
    </>
  )
}
