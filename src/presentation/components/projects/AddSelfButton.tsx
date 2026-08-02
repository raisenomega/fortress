import { useEffect, useState } from 'react'
import { api } from '../../adapters/fortress-api'
import { addSelfProject } from '../../services/project-service'

interface AddSelfButtonProps {
  readonly onAdded: () => void
  readonly onError: (message: string) => void
}

/**
 * FORTRESS auditandose a si misma. Solo aparece cuando su codigo fuente esta
 * en disco: en la app empaquetada vive dentro del asar y no se puede escanear.
 */
export function AddSelfButton({ onAdded, onError }: AddSelfButtonProps): React.JSX.Element | null {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    void api()
      .projects.self()
      .then((self) => setAvailable(self !== null))
  }, [])

  if (!available) return null

  async function add(): Promise<void> {
    const result = await addSelfProject()
    if (result === null) return onError('El codigo fuente de FORTRESS no esta accesible.')
    if (!result.ok) return onError(result.error)
    onAdded()
  }

  return (
    <button
      type="button"
      onClick={() => void add()}
      title="Agrega FORTRESS como proyecto para revisarla con sus propios agentes"
      className="tap mt-3 w-full rounded-md border border-primary/40 bg-accent/20 px-3 py-2 text-xs text-primary hover:bg-accent/30"
    >
      🏰 Agregar FORTRESS a si misma
    </button>
  )
}
