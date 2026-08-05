import { toggleGenesis } from '../../services/genesis-service'
import { useGenesisConfigured, useGenesisStatus } from '../../stores/genesis-store'

/** Enciende/apaga el bucle. Deshabilitado hasta que los topes esten guardados. */
export function GenesisToggle(): React.JSX.Element {
  const configured = useGenesisConfigured()
  const running = useGenesisStatus()?.phase === 'corriendo'
  return (
    <button
      type="button"
      disabled={!configured}
      title={configured ? '' : 'Fija los topes de genesis en Configuracion'}
      onClick={() => void toggleGenesis(!running)}
      className="rounded bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {running ? 'Detener genesis' : 'Encender genesis'}
    </button>
  )
}
