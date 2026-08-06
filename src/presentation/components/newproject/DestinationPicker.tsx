import { useEffect, useState } from 'react'
import { api } from '../../adapters/fortress-api'
import type { HomeDir } from '../../../preload/system-api'

interface DestinationPickerProps {
  readonly value: string
  readonly onPick: (path: string) => void
}

/**
 * Los atajos vienen de Electron y no se escriben a mano: dependen del idioma
 * del sistema. Aqui son Escritorio y Documentos; en otro equipo serian Desktop
 * y Documents, y una ruta inventada no existiria.
 */
export function DestinationPicker({ value, onPick }: DestinationPickerProps): React.JSX.Element {
  const [dirs, setDirs] = useState<readonly HomeDir[]>([])

  useEffect(() => {
    void api().newProject.homeDirs().then(setDirs)
  }, [])

  // Al cargar los atajos, si aun no hay destino, se elige el primero. Tras el
  // primer pick value deja de ser '' y no se vuelve a tocar la eleccion.
  useEffect(() => {
    if (value === '' && dirs[0]) onPick(dirs[0].path)
  }, [dirs, value, onPick])

  return (
    <div className="flex flex-wrap gap-1.5">
      {dirs.map((dir) => (
        <button
          key={dir.path}
          type="button"
          onClick={() => onPick(dir.path)}
          title={dir.path}
          aria-pressed={value === dir.path}
          className={`tap rounded-md px-2.5 py-1 text-xs ${
            value === dir.path
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {dir.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          void api()
            .projects.pickFolder()
            .then((p) => p && onPick(p.path))
        }
        className="tap rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Elegir otra...
      </button>
    </div>
  )
}
