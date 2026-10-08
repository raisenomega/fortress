import { useState } from 'react'
import { nuevoHiloSuelto } from '../../services/barra-del-chat'
import { crearCarpetaYEntrar } from '../../services/carpetas-de-la-barra'

interface CabeceraDeLaBarraProps {
  readonly onBuscar: (texto: string) => void
}

/** Cabecera de la barra (Fase 3): Nuevo chat (suelto), Crear carpeta (input
 *  inline: Enter crea y entra, Escape o clic fuera cancela) y Buscar. */
export function CabeceraDeLaBarra({ onBuscar }: CabeceraDeLaBarraProps): React.JSX.Element {
  const [nombre, setNombre] = useState<string | null>(null)
  const crear = (): void => {
    const limpio = (nombre ?? '').trim()
    if (limpio !== '') void crearCarpetaYEntrar(limpio).catch(console.error)
    setNombre(null)
  }

  return (
    <div className="flex flex-col gap-1 pb-2">
      <button
        type="button"
        onClick={() => nuevoHiloSuelto()}
        className="rounded px-2 py-1 text-left text-sm text-primary hover:bg-primary/10"
      >
        + Nuevo chat
      </button>
      {nombre === null ? (
        <button
          type="button"
          onClick={() => setNombre('')}
          className="rounded px-2 py-1 text-left text-sm text-muted-foreground hover:bg-primary/10"
        >
          + Crear carpeta
        </button>
      ) : (
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') crear()
            if (e.key === 'Escape') setNombre(null)
          }}
          onBlur={() => setNombre(null)}
          placeholder="Nombre de la carpeta"
          className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
        />
      )}
      <input
        onChange={(e) => onBuscar(e.target.value)}
        placeholder="Buscar"
        className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
      />
    </div>
  )
}
