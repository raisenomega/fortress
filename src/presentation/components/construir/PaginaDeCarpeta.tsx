import { useEffect, useState } from 'react'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { cargarListas, elegirHilo } from '../../services/barra-del-chat'
import { hilosDeCarpeta, nuevoHiloEnCarpeta } from '../../services/carpetas-de-la-barra'

interface PaginaDeCarpetaProps {
  readonly carpetaId: string
}

/** La PAGINA de una carpeta (flujo B del contrato): nombre, nuevo chat que
 *  nace DENTRO, y sus hilos. La personalizacion llega en Fase 5. */
export function PaginaDeCarpeta({ carpetaId }: PaginaDeCarpetaProps): React.JSX.Element {
  const [nombre, setNombre] = useState('')
  const [hilos, setHilos] = useState<readonly HiloDeChat[]>([])
  useEffect(() => {
    void hilosDeCarpeta(carpetaId).then(setHilos).catch(console.error)
    void cargarListas()
      .then((l) => setNombre(l.carpetas.find((c) => c.id === carpetaId)?.nombre ?? ''))
      .catch(console.error)
  }, [carpetaId])

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
      <h2 className="font-display text-lg text-foreground">{nombre}</h2>
      <button
        type="button"
        onClick={() => void nuevoHiloEnCarpeta(carpetaId)}
        className="self-start rounded px-2 py-1 text-sm text-primary hover:bg-primary/10"
      >
        + Nuevo chat en esta carpeta
      </button>
      {hilos.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => void elegirHilo(h)}
          className="truncate rounded px-2 py-1 text-left text-sm text-foreground hover:bg-primary/10"
        >
          {h.titulo}
        </button>
      ))}
      {hilos.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin conversaciones aun.</p>
      )}
    </div>
  )
}
