import { useState } from 'react'
import { runEpisode } from '../../services/agent-draft-service'

interface RunEpisodeButtonProps {
  readonly capabilityId: string
}

/** Dispara UN episodio de aprendizaje (corrida real, acotada) para la capacidad. */
export function RunEpisodeButton({ capabilityId }: RunEpisodeButtonProps): React.JSX.Element {
  const [msg, setMsg] = useState('')
  const run = (): void => {
    setMsg('Resolviendo un escenario...')
    void runEpisode(capabilityId).then((result) => {
      setMsg(result.ok ? `Episodio registrado: ${result.value.outcome}` : result.error)
    })
  }
  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={run}
        className="rounded bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/20"
      >
        Correr un episodio
      </button>
      {msg ? <span className="ml-2 text-[11px] text-muted-foreground">{msg}</span> : null}
    </div>
  )
}
