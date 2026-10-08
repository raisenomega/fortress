import { useEffect, useState } from 'react'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { cargarListas, type ListasDeLaBarra } from '../../services/barra-del-chat'
import { abrirCarpeta, buscarHilos } from '../../services/carpetas-de-la-barra'
import { useBarraStore } from '../../stores/barra-store'
import { useConstruirStore } from '../../stores/construir-store'
import { CabeceraDeLaBarra } from './CabeceraDeLaBarra'
import { FilaDeHilo } from './FilaDeHilo'

const VACIAS: ListasDeLaBarra = { carpetas: [], sueltos: [] }
const SECCION = 'text-[11px] font-semibold tracking-wide text-muted-foreground'

/** La barra organizadora del Chat: SOLO el plano de libre. El clic MANDA. */
export function BarraDelChat(): React.JSX.Element {
  const seleccion = useBarraStore((s) => s.seleccion)
  const vistaDeCarpeta = useBarraStore((s) => s.vistaDeCarpeta)
  const busy = useConstruirStore((s) => s.busy)
  const [listas, setListas] = useState(VACIAS)
  const [filtro, setFiltro] = useState('')
  const [resultados, setResultados] = useState<readonly HiloDeChat[]>([])
  useEffect(() => {
    void cargarListas().then(setListas).catch(console.error)
  }, [seleccion, vistaDeCarpeta, busy])
  const buscar = (texto: string): void => {
    setFiltro(texto)
    void buscarHilos(texto).then(setResultados).catch(console.error)
  }

  const fila = (h: HiloDeChat): React.JSX.Element => (
    <FilaDeHilo key={h.id} hilo={h} elegido={h.id === seleccion} />
  )

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3">
      <CabeceraDeLaBarra onBuscar={buscar} />
      {filtro.trim() !== '' ? (
        <>
          <p className={SECCION}>RESULTADOS</p>
          {resultados.map(fila)}
        </>
      ) : (
        <>
          <p className={SECCION}>CARPETAS</p>
          {listas.carpetas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void abrirCarpeta(c.id)}
              className="truncate rounded px-2 py-1 text-left text-sm text-foreground hover:bg-primary/10"
            >
              {c.nombre}
            </button>
          ))}
          <p className={`pt-3 ${SECCION}`}>SIN CARPETA</p>
          {listas.sueltos.map(fila)}
        </>
      )}
    </aside>
  )
}
