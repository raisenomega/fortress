import type { GenesisStatus } from '@domain/system/genesis-status'

interface GenesisHudProps {
  readonly status: GenesisStatus
}

const STOP_LABEL: Record<string, string> = {
  detenido: 'Detenido por ti',
  'tope-gasto': 'Tope de gasto alcanzado',
  'tope-episodios': 'Tope de episodios alcanzado',
  'sin-trabajo': 'Sin capacidades por avanzar'
}

/** Estado del bucle: fase, episodios/tope, gasto/tope y motivo de parada. */
export function GenesisHud({ status }: GenesisHudProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
      <p>
        {status.phase === 'corriendo' ? 'Corriendo' : 'Parado'} · episodios {status.episodesDone}/
        {status.maxEpisodes} · gasto {status.spentSession.toFixed(2)}/{status.costCap} USD
      </p>
      {status.stopReason ? (
        <p className="mt-1 text-foreground">
          Motivo: {STOP_LABEL[status.stopReason] ?? status.stopReason}
        </p>
      ) : null}
    </div>
  )
}
