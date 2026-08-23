import { drenar, pararDrenaje } from '../../services/drenaje-service'
import { proposeRepair } from '../../services/repair-service'
import { useRepairStore } from '../../stores/repair-store'
import { Icon } from '../common/Icon'

interface MotorAccionesProps {
  readonly projectId: string | null
}

const BOTON =
  'flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs text-foreground hover:border-primary/50 disabled:opacity-50'

/**
 * Las dos formas de poner el motor a trabajar, y la diferencia importa.
 *
 * Proponer hace UNA vuelta. Drenar las hace todas: recorre los hallazgos que
 * pueden aspirar al cerco y deja cada fix juzgado esperando firma, sin escribir
 * al chat y sin tocar el arbol vivo. Ninguna de las dos integra nada — eso solo
 * ocurre firmando en la cola.
 */
export function MotorAcciones({ projectId }: MotorAccionesProps): React.JSX.Element {
  const busy = useRepairStore((state) => state.busy)
  const drenando = useRepairStore((state) => state.drenando)
  const sinProyecto = projectId === null

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={busy || drenando || sinProyecto}
        onClick={() => projectId !== null && void proposeRepair(projectId)}
        className={BOTON}
      >
        <Icon name="wrench" size={12} />
        {busy ? 'Analizando...' : 'Proponer reparacion'}
      </button>

      <button
        type="button"
        disabled={busy || sinProyecto}
        onClick={() => projectId !== null && void (drenando ? pararDrenaje : drenar)(projectId)}
        title="Recorre los hallazgos elegibles y deja cada fix esperando firma"
        className={BOTON}
      >
        <span className={drenando ? 'animate-spin' : ''}>
          <Icon name={drenando ? 'refresh-cw' : 'play'} size={12} />
        </span>
        {drenando ? 'Drenando... (parar)' : 'Drenar los elegibles'}
      </button>
    </div>
  )
}
