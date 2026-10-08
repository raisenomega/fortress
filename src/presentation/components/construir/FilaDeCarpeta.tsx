import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { hilosDeCarpeta, nuevoHiloEnCarpeta } from '../../services/carpetas-de-la-barra'
import { useBarraStore } from '../../stores/barra-store'
import { useConstruirStore } from '../../stores/construir-store'
import { FilaDeHilo } from './FilaDeHilo'

interface FilaDeCarpetaProps {
  readonly carpeta: Carpeta
  readonly seleccion: string | null
}

/** Una carpeta del ARBOL (Revision A): el clic DESPLIEGA o pliega — JAMAS
 *  entra al area de chat. Sus hilos cuelgan anidados, con su «+ nuevo». */
export function FilaDeCarpeta({ carpeta, seleccion }: FilaDeCarpetaProps): React.JSX.Element {
  const expandida = useBarraStore((s) => s.expandidas.includes(carpeta.id))
  const busy = useConstruirStore((s) => s.busy)
  const [hilos, setHilos] = useState<readonly HiloDeChat[]>([])
  useEffect(() => {
    if (expandida) void hilosDeCarpeta(carpeta.id).then(setHilos).catch(console.error)
  }, [expandida, carpeta.id, seleccion, busy])

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => useBarraStore.getState().toggleCarpeta(carpeta.id)}
        className="flex items-center gap-1 truncate rounded px-2 py-1 text-left text-sm text-foreground hover:bg-primary/10"
      >
        {expandida ? <ChevronDown size={13} aria-hidden /> : <ChevronRight size={13} aria-hidden />}
        {carpeta.nombre}
      </button>
      {expandida && (
        <div className="flex flex-col pl-4">
          <button
            type="button"
            onClick={() => void nuevoHiloEnCarpeta(carpeta.id)}
            className="rounded px-2 py-1 text-left text-xs text-primary hover:bg-primary/10"
          >
            + nuevo chat aqui
          </button>
          {hilos.map((h) => (
            <FilaDeHilo key={h.id} hilo={h} elegido={h.id === seleccion} />
          ))}
        </div>
      )}
    </div>
  )
}
