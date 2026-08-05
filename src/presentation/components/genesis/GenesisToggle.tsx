import { toggleGenesis } from '../../services/genesis-service'
import { useGenesisConfigured, useGenesisStatus } from '../../stores/genesis-store'

const BASE = 'rounded border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed'

/**
 * Enciende/apaga el bucle. Colores por estado: verde para Encender, rojo para
 * Detener, gris y deshabilitado hasta que los topes esten guardados.
 */
export function GenesisToggle(): React.JSX.Element {
  const configured = useGenesisConfigured()
  const running = useGenesisStatus()?.phase === 'corriendo'
  const color = !configured
    ? 'border-medium/40 text-medium opacity-60'
    : running
      ? 'border-critical/50 text-critical hover:bg-critical/10'
      : 'border-success/50 text-success hover:bg-success/10'
  return (
    <button
      type="button"
      disabled={!configured}
      title={configured ? '' : 'Fija los topes de genesis en Configuracion'}
      onClick={() => void toggleGenesis(!running)}
      className={`${BASE} ${color}`}
    >
      {running ? 'Detener genesis' : 'Encender genesis'}
    </button>
  )
}
