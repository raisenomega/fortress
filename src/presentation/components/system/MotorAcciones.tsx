import { proposeRepair } from '../../services/repair-service'
import { useRepairStore } from '../../stores/repair-store'
import { BotonDrenar } from './BotonDrenar'
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

      <BotonDrenar projectId={projectId} className={BOTON} disabled={busy || sinProyecto} />
    </div>
  )
}
