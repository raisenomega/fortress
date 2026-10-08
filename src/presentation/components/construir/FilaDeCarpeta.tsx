import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react'
import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { hilosDeCarpeta, nuevoHiloEnCarpeta } from '../../services/carpetas-de-la-barra'
import { useBarraStore } from '../../stores/barra-store'
import { useConstruirStore } from '../../stores/construir-store'
import { FilaDeHilo } from './FilaDeHilo'
import { MenuDeCarpeta } from './MenuDeCarpeta'

interface FilaDeCarpetaProps {
  readonly carpeta: Carpeta
  readonly seleccion: string | null
}

const flecha = (expandida: boolean): React.JSX.Element =>
  expandida ? <ChevronDown size={13} aria-hidden /> : <ChevronRight size={13} aria-hidden />

/** Una carpeta del ARBOL (Revision A): el clic DESPLIEGA o pliega — JAMAS
 *  entra al area de chat. Sus hilos cuelgan anidados; el ⋯ la gestiona. */
export function FilaDeCarpeta({ carpeta, seleccion }: FilaDeCarpetaProps): React.JSX.Element {
  const expandida = useBarraStore((s) => s.expandidas.includes(carpeta.id))
  const refresco = useBarraStore((s) => s.refresco)
  const busy = useConstruirStore((s) => s.busy)
  const [hilos, setHilos] = useState<readonly HiloDeChat[]>([])
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    if (expandida) void hilosDeCarpeta(carpeta.id).then(setHilos).catch(console.error)
  }, [expandida, carpeta.id, seleccion, busy, refresco])

  return (
    <div className="flex flex-col">
      <div className="group relative flex items-center">
        <button
          type="button"
          onClick={() => useBarraStore.getState().toggleCarpeta(carpeta.id)}
          className="flex min-w-0 flex-1 items-center gap-1 truncate rounded px-2 py-1 text-left text-sm text-foreground hover:bg-primary/10"
        >
          {flecha(expandida)}
          {carpeta.nombre}
        </button>
        <button
          type="button"
          aria-label={`Gestionar carpeta ${carpeta.nombre}`}
          onClick={() => setMenu(true)}
          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-primary/10 focus-visible:opacity-100"
        >
          <MoreHorizontal size={13} aria-hidden />
        </button>
        {menu && <MenuDeCarpeta carpeta={carpeta} onCerrar={() => setMenu(false)} />}
      </div>
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
