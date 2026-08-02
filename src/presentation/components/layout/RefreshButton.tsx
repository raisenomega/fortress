import { RotateCw } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../adapters/fortress-api'
import { ConfirmRefresh } from './ConfirmRefresh'

/**
 * Reinicio en caliente. Si hay trabajo en curso pregunta antes: terminar un
 * escaneo a medias pierde ese escaneo, y eso lo decide el operador.
 */
export function RefreshButton(): React.JSX.Element {
  const [pending, setPending] = useState<number | null>(null)

  async function start(): Promise<void> {
    const live = await api().maintenance.liveJobs()
    if (live > 0) return setPending(live)
    await api().maintenance.cleanup()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void start()}
        title="Reiniciar en caliente: termina procesos colgados, vacia la cache y recarga"
        className="tap shrink-0 rounded-md border border-border p-1.5 hover:border-primary/40"
      >
        <RotateCw size={15} aria-hidden />
      </button>

      {pending !== null ? (
        <ConfirmRefresh
          jobs={pending}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            setPending(null)
            void api().maintenance.cleanup()
          }}
        />
      ) : null}
    </>
  )
}
