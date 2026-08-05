import { useState } from 'react'
import { Icon } from '../common/Icon'
import { useConstruirStore } from '../../stores/construir-store'
import { stopBuild, submitConstruir } from '../../services/construir-service'
import { ConstruirModeMenu } from './ConstruirModeMenu'

interface ConstruirSendProps {
  readonly projectId: string
}

/** Control derecho del input: Detener si trabaja; si no, la flecha que abre modos. */
export function ConstruirSend({ projectId }: ConstruirSendProps): React.JSX.Element {
  const [menu, setMenu] = useState(false)
  const busy = useConstruirStore((s) => s.busy)

  if (busy) {
    return (
      <button
        type="button"
        onClick={() => void stopBuild(projectId)}
        className="tap rounded-md border border-critical/40 px-2 py-1.5 text-xs text-critical hover:bg-critical/10"
      >
        Detener
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        title="Elegir modo"
        className="tap rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary-hover"
      >
        <Icon name="arrow-up" size={18} />
      </button>
      {menu ? (
        <ConstruirModeMenu
          onPick={(mode) => {
            setMenu(false)
            submitConstruir(projectId, mode)
          }}
        />
      ) : null}
    </div>
  )
}
